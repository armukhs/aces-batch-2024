import { Hono } from "hono";
import {
  BatchGroups,
  BatchSettings,
  FormBatchSettings,
  FormBatch,
  OrgRow,
  PersonsTable,
  BatchPersons,
  BatchAssessors,
  Slotmap,
  GroupAssessors,
} from "./components";
import { createSample, getAssessorReqs, loadPersonsInGroups, regroupBatch, updateBatch } from "./utils";

const htmx = new Hono<{ Bindings: Env }>();

// TRIAL

htmx.get("/trial/:id", (c) => {
  const id = c.req.param("id")
  const trid = "TR" + new Date().getTime();
  return c.html(
    <tr id={trid}>
      <td colspan={2} style="background:#eef">
        <form>
          <input trigger="btn" autofocus type="text" onkeydown="coba(event)" />
          <button id="btn" onclick={`document.querySelector("#${trid}").remove()`}>BTN</button>
        </form>
      </td>
    </tr>
  );
})

// ORG

// Response on cancelling
htmx.get("/org/:id", async (c) => {
  const id = c.req.param("id");
  const stm = `SELECT * FROM v_organizations WHERE id=?`;
  const rs = await c.env.DB.prepare(stm).bind(id).first();
  const o = rs as VOrganization;
  return c.html(<OrgRow org={o} />)
})

htmx.get("/org/:id/new-batch", async (c) => {
  const id = c.req.param("id");
  const stm = `SELECT * FROM v_organizations WHERE id=?`;
  const rs = await c.env.DB.prepare(stm).bind(id).first();
  const o = rs as VOrganization;
  return c.html(<FormBatch org={o} />);
})

htmx.post("/org", async (c) => {
  const { name } = await c.req.parseBody()
  const stm0 = `INSERT INTO organizations (name) VALUES (?)`;
  const stm1 = `SELECT * FROM v_organizations ORDER BY id DESC LIMIT 1`;
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(name),
    c.env.DB.prepare(stm1),
  ])
  const org = rs[1].results[0] as VOrganization;
  c.res.headers.append("HX-Trigger", "orgAddedEvent");
  return c.html(<OrgRow org={org} />)
})

// BATCH SETTINGS

htmx.get("/batch-settings/:id", async (c) => {
  const id = c.req.param("id");
  const stm0 = `SELECT * FROM v_batches WHERE id=?`;
  const rs = await c.env.DB.prepare(stm0).bind(id).first();
  if (!rs) return c.notFound();
  const batch = rs as VBatch;
  return c.html(<BatchSettings batch={batch} />);
})

htmx.get("/batch-settings-form/:id", async (c) => {
  const id = c.req.param("id");
  const stm0 = `SELECT * FROM v_batches WHERE id=?`;
  const stm1 = `SELECT * FROM tools`;
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(id),
    c.env.DB.prepare(stm1),
  ])
  if (rs[0].results.length == 0) return c.notFound();
  const batch = rs[0].results[0] as VBatch;
  const tools = rs[1].results as Tools[];
  return c.html(<FormBatchSettings batch={batch} tools={tools} />);
});

htmx.put("/batch-settings", async (c) => {
  // Update settings
  await updateBatch(c);

  // Load batch
  const { id } = await c.req.parseBody();
  const stm0 = `SELECT * FROM v_batches WHERE id=?`;
  const rs0 = await c.env.DB.prepare(stm0).bind(id).first();
  const batch = rs0 as VBatch;

  let groups: VGroup[] = [];
  let expreq: ExpertReqs|null = null;
  if (batch.persons) groups = await regroupBatch(c.env.DB, batch);
  if (groups.length) {
    const stm1 = `SELECT * FROM v_assreqs WHERE batch_id=?`;
    expreq = await c.env.DB.prepare(stm1).bind(id).first();
  }

  return c.html(
    <div id="batch-briefs">
      <BatchSettings batch={batch} />
      <div id="batch-persons-assessors">
        <BatchPersons batch={batch} groups={groups} />
        {batch.persons > 0 && <BatchAssessors batch={batch} ass_reqs={expreq} />}
      </div>
    </div>
  );
});

// PESERTA

// CREATE SAMPLE persons
htmx.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const len = parseInt(body.samplenum as string);
  const batch_id = parseInt(body.batch_id as string);
  const org_id = parseInt(body.org_id as string);
  await createSample(c.env.DB, batch_id, org_id, len);

  // batch must be loaded after person data has been saved
  const stm0 = `SELECT * FROM v_batches WHERE id=?`;
  const batch = (await c.env.DB.prepare(stm0).bind(batch_id).first()) as VBatch;
  const groups = await regroupBatch(c.env.DB, batch);

  // reqs must be loaded after regrouping
  const stm1 = `SELECT * FROM v_assreqs WHERE batch_id=?`;
  const req = await c.env.DB.prepare(stm1).bind(batch.id).first() as ExpertReqs;
  const { minlgd, maxlgd, minf2f, maxf2f } = getAssessorReqs(req);
  return c.html(
    <div id="batch-persons-assessors">
      <BatchPersons batch={batch} groups={groups} />
      <div id="batch-assessors">
        <h3 style="margin-bottom:0.5rem">Kebutuhan Asesor</h3>
        <p>
          Asesor Group: MIN {minlgd} - MAX {maxlgd}
        </p>
        <p>
          Asesor FaceToFace: MIN {minf2f} - MAX {maxf2f}
        </p>
        <details style="margin:1rem 0">
          <summary>JSON ExpReq</summary>
          <pre>{JSON.stringify(req, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
})

// Form alokasi asesor grup
htmx.get("/bat/:id/alokasi-asesor-grup", async (c) => {
  return c.html(
    <div>
      <p>Alokasi asesor grup</p>
    </div>
  )
})

// DELETE person
htmx.delete("/peserta", async (c) => {
  const { person_id, batch_id } = await c.req.parseBody();
  const stm0 = `DELETE FROM persons WHERE id=?`;
  const stm1 = `SELECT * FROM v_batches WHERE id=? LIMIT 1`;
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(person_id),
    c.env.DB.prepare(stm1).bind(batch_id),
  ]);
  const deleted = rs[0];
  const batch = rs[1].results[0] as VBatch;
  console.log(deleted)
  // Regroup
  const groups = await regroupBatch(c.env.DB, batch);
  // Load persons in groups
  const pigs = await loadPersonsInGroups(c.env.DB, batch);
  return c.html(
    <div id="batch-persons">
      <p style="margin:1rem 0 .5rem">
        Jumlah peserta <b>{batch.persons} orang</b>, terbagi dalam <b>{batch.groups} grup</b> dan jadwal sbb:
      </p>
      <BatchGroups groups={groups} />
      {/* <div style="margin-top:2rem">
        <PersonsTable groups={pigs} />
      </div> */}
      <div>
        <h3>Daftar peserta</h3>
        <hr style="margin:.5rem 0" />
        <PersonsTable groups={pigs} />
      </div>
    </div>
  );
})

// Update individual group assessor
htmx.post("/bat/:id/asesor", async (c) => {
  console.log("BODY", await c.req.parseBody());
  const {batch_id, group_id, lgd_ass_id, fullname} = await c.req.parseBody()
  const stm0 = `UPDATE groups SET lgd_ass_id=? WHERE batch_id=? AND id=?`;
  const rs = await c.env.DB.prepare(stm0).bind(lgd_ass_id, batch_id, group_id).run();
  console.log(batch_id, group_id, lgd_ass_id, fullname);
  console.log(rs)
  c.res.headers.append("HX-Trigger", "assessorChanged");
  return c.html(
    <form
      style="display:flex;align-items:center;gap:.5rem"
      hx-post={`/htmx/bat/${batch_id}/asesor`}
      hx-target="this"
      hx-swap="outerHTML">
      <input type="hidden" name="batch_id" value={batch_id as string} />
      <input type="hidden" name="group_id" value={group_id as string} />
      <input id={`ass-${group_id as string}`} type="hidden" name="lgd_ass_id" />
      <input
        readonly
        style="flex-grow:1"
        type="text"
        name="fullname"
        value={fullname as string}
        id={`div-${group_id as string}`}
      />
      <button disabled>OK</button>
    </form>
  );
})

// SUSPENDED htmx/bat/1103/asesor-grup
htmx.get("/bat/:id/asesor-grup", async (c) => {
  const id = c.req.param("id")
  const stm = `SELECT * FROM v_groups WHERE batch_id=?`;
  const rs = await c.env.DB.prepare(stm).bind(id).all();
  const groups = rs.results as VGroup[];
  c.res.headers.append("HX-Trigger", "GROUPS_REFRESHED");
  return c.html(
    <GroupAssessors batch_id={id} groups={groups} bucket={[]} disabled={false} />
  );
})

htmx.get("/bat/:id/asesor-f2f", async (c) => {
  const id = c.req.param("id");
  const stm0 = `SELECT * FROM v_f2f_assessors WHERE batch_id=?`;
  const stm1 = `SELECT * FROM assessors`;
  const stm2 = `SELECT distinct id FROM groups WHERE batch_id=?`;
  const stm3 = `SELECT group_id, person_id, f2f_ass_id, pf2f FROM v_groupings WHERE batch_id=?`;
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(id),
    c.env.DB.prepare(stm1),
    c.env.DB.prepare(stm2).bind(id),
    c.env.DB.prepare(stm3).bind(id),
  ]);
  const allocated: any[] = rs[0].results;
  const assessors = rs[1].results as Assessor[];
  const group_ids = rs[2].results.map((x:any) => x.id)
  const groupings = rs[3].results;
  // groups of persons
  const groups_of_groupings: any[] = [];
  group_ids.forEach((id) => {
    groups_of_groupings.push(groupings.filter((p: any) => p.group_id == id));
  });
  // Iterate through gog
  const permutation = 4;
  for (let i=0; i<groups_of_groupings.length; i++) {
    for (let g=0; g<groups_of_groupings[i].length; g++) {
      const o = groups_of_groupings[i][g];
      const index = i < permutation ? 0+g : groups_of_groupings[i].length + g + 1;
      o.f2f_ass_id = allocated[index].assessor_id;
      const pos = o.pf2f;
      // console.log("ASS", allocated[index]);
      if (pos == 1) allocated[index].slot1 = o.person_id;
      else if (pos == 2) allocated[index].slot2 = o.person_id;
      else if (pos == 3) allocated[index].slot3 = o.person_id;
      else if (pos == 4) allocated[index].slot4 = o.person_id;
    }
  }
  return c.html(
    <div>
      <p>Allocated: {allocated.length}</p>
      <p>Peserta: {groupings.length}</p>
      <p>Bucket: {assessors.length}</p>
      <p>G of G: {groups_of_groupings.length}</p>
      <pre>{JSON.stringify(allocated, null, 2)}</pre>
      <pre>{JSON.stringify(groups_of_groupings, null, 2)}</pre>
    </div>
  );
})

htmx.post("/test-f2f", async (c) => {
  const { batch_id, f2f_ass_ids } = await c.req.parseBody();
  const ids = (f2f_ass_ids as string).trim().split(" ");
  const ass_ids = ids.map(x => parseInt(x)); //
  const stm0 = `SELECT distinct id FROM groups WHERE batch_id=?`;
  const stm1 = `SELECT group_id, person_id, f2f_ass_id, pf2f FROM v_groupings WHERE batch_id=?`;
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(batch_id),
    c.env.DB.prepare(stm1).bind(batch_id),
  ]);
  const group_ids = rs[0].results.map((x: any) => x.id);
  const groupings = rs[1].results;
  const groups_of_groupings: any[] = [];
  group_ids.forEach((id) => {
    groups_of_groupings.push(groupings.filter((p: any) => p.group_id == id));
  });
  // Iterate through gog
  const permutation = 4;
  for (let i = 0; i < groups_of_groupings.length; i++) {
    for (let g = 0; g < groups_of_groupings[i].length; g++) {
      const o = groups_of_groupings[i][g];
      const index = i < permutation ? 0 + g : groups_of_groupings[i].length + g + 1;
      o.f2f_ass_id = ass_ids[index];
    }
  }

  // Flatten gog
  const flattened = []
  for (let i = 0; i < groups_of_groupings.length; i++) {
    for (let g = 0; g < groups_of_groupings[i].length; g++) {
      const o = groups_of_groupings[i][g];
      flattened.push(o);
    }
  }
  // UPDATE groupings SET f2f_ass_id='' WHERE person_id=''
  const stms = flattened.map((x) => `UPDATE groupings SET f2f_ass_id=${x.f2f_ass_id} WHERE person_id='${x.person_id}'`);
  await c.env.DB.batch(stms.map((s) => c.env.DB.prepare(s)));

  return c.html(<pre>{JSON.stringify(stms, null, 2)}</pre>);
});

export { htmx }
