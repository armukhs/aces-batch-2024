import { Hono } from "hono";
import { BatchAssessors, BatchGroups, BatchHero, BatchList, BatchMenu, BatchPersons, BatchSettings, FormBatchSettings, GroupAssessors, Layout, MainMenu, PersonsTable, ReqsTable, Slotmap } from "./components";
import { getAssessorReqs, loadPersonsInGroups } from "./utils";
import { html } from "hono/html";

const bat = new Hono<{ Bindings: Env }>();

// Daftar batch
bat.get("/", async (c) => {
  const stm = `SELECT * FROM v_batches`;
  const rs = await c.env.DB.prepare(stm).all();
  return c.html(
    <Layout>
      <MainMenu />
      <h1>Daftar Batch</h1>
      <BatchList batches={rs.results as VBatch[]} />
    </Layout>
  );
});

// Detil batch
bat.get("/:id", async (c) => {
  const id = c.req.param("id")
  const stm0 = `SELECT * FROM v_batches WHERE id=?`
  const stm1 = `SELECT * FROM v_groups WHERE batch_id=?`;
  const stm2 = `SELECT * FROM tools`;
  const stm3 = `SELECT * FROM v_assreqs WHERE batch_id=?`;
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(id),
    c.env.DB.prepare(stm1).bind(id),
    c.env.DB.prepare(stm2),
    c.env.DB.prepare(stm3).bind(id),
  ]);
  if (!rs[0].results.length) return c.notFound()
  const batch = rs[0].results[0] as VBatch
  const groups = rs[1].results as VGroup[]
  const tools = rs[2].results as Tools[]
  const ass_reqs = rs[3].results[0] as ExpertReqs;
  // const { minlgd, maxlgd, minf2f, maxf2f } = getAssessorReqs(expreq);
  return c.html(
    <Layout>
      <MainMenu />
      <BatchHero batch={batch} />
      <BatchMenu id={batch.id} current="" />

      <div id="batch-briefs">
        {!batch.modules && <FormBatchSettings batch={batch} tools={tools} />}
        {batch.modules && <BatchSettings batch={batch} />}
        <div id="batch-persons-assessors">
          <BatchPersons batch={batch} groups={groups} />
          <BatchAssessors batch={batch} ass_reqs={ass_reqs} />
        </div>
      </div>
      {/* <pre>{JSON.stringify(batch, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(expreq, null, 2)}</pre> */}
      <script src="/static/js/batch-settings.js"></script>
    </Layout>
  );
})


bat.get("/test/lazy-1", async (c) => {
  return c.html(<h2>HOLYMOLY</h2>)
})

// Peserta batch
bat.get("/:id/peserta", async (c) => {
  const id = c.req.param("id");
  const stm0 = "SELECT * FROM v_batches WHERE id=?";
  const stm1 = `SELECT * FROM v_groups WHERE batch_id=?`;
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(id),
    c.env.DB.prepare(stm1).bind(id),
  ])
  const batch = rs[0].results[0] as VBatch;
  const groups = rs[1].results as VGroup[];
  const pigs = await loadPersonsInGroups(c.env.DB, batch);
  return c.html(
    <Layout>
      <MainMenu />
      <BatchHero batch={batch} />
      <BatchMenu id={batch.id} current="peserta" />

      <div id="batch-persons">
        <p style="margin:1rem 0 .5rem">
          Jumlah peserta <b>{batch.persons} orang</b>, terbagi dalam <b>{batch.groups} grup</b> dan jadwal sbb:
        </p>
        <BatchGroups groups={groups} />
        <div>
          <h3>Daftar peserta</h3>
          <hr style="margin:.5rem 0" />
          <PersonsTable groups={pigs} />
        </div>
      </div>
    </Layout>
  );
})


bat.get("/:id/asesor", async (c) => {
  const id = c.req.param("id");
  const stm0 = `SELECT * FROM v_batches WHERE id=?`;
  const stm1 = `SELECT * FROM v_assreqs WHERE batch_id=?`;
  const stm2 = `SELECT * FROM assessors`;
  const stm3 = `SELECT * FROM v_groups WHERE batch_id=?`
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(id),
    c.env.DB.prepare(stm1).bind(id),
    c.env.DB.prepare(stm2),
    c.env.DB.prepare(stm3).bind(id),
  ]);
  const batch = rs[0].results[0] as VBatch;
  const expreq = rs[1].results[0] as ExpertReqs;
  const { maxlgd, maxf2f } = getAssessorReqs(expreq);
  const assessors: AssessorWithSlot[] = (rs[2].results as Assessor[]).map((a) => {
    return { ...a, slot1: "", slot2: "", slot3: "", slot4: "" };
  })
  const groups = rs[3].results as VGroup[];

  // match groups' assessor
  groups.forEach(g => {
    if (g.lgd_ass_id) {
      const a = assessors.find((x) => x.id == g.lgd_ass_id);
      if (a) {
        if (g.plgd == 1) a.slot1 = g.id;
        else if (g.plgd == 2) a.slot2 = g.id;
        else if (g.plgd == 3) a.slot3 = g.id;
        else if (g.plgd == 4) a.slot4 = g.id;
      }
    }
  })

  if (!batch) return c.notFound();
  // const js = ["/df-asesor", "/static/js/asesor.js"];
  const js = ["/static/js/asesor.js"];
  const title = "ASESOR Batch"
  return c.html(
    <Layout js={js} title={title}>
      <MainMenu />
      <BatchHero batch={batch} />
      <BatchMenu id={batch.id} current="asesor" />
      <div style="margin-top:-.45rem">
        <ReqsTable req={expreq} />
      </div>

      {/* <pre style="margin:2rem 0;color:maroon">{JSON.stringify(groups[0], null, 2)}</pre> */}
      {/* <pre style="margin:2rem 0;color:maroon">{JSON.stringify(assessors.find(a=>a.id==15), null, 2)}</pre> */}

      <GroupAssessors batch_id={id} groups={groups} bucket={assessors} disabled={true} />

      <h3>Asesor Individu</h3>
      <hr style="margin:0.5rem 0" />
      <p>Pilih: Mode Alokasi atau Mode Manual 1 to 1</p>

      <div style="min-height:152px;padding:1rem 0;">
        <div id="f2f-asstray" style="display:grid;grid-template-columns:1fr 1fr;column-gap:20px;row-gap:8px;">
          {/*  */}
        </div>
      </div>

      <div class="border-t border-b" style="display:flex;gap:1rem;padding:.5rem 0">
        <span>
          Dipilih: <b id="AGLENGTH">0</b>
        </span>
        <span>
          MIN: <b id="F2FMIN">0</b>
        </span>
        <span>
          MAX: <b id="F2FMAX">0</b>
        </span>
      </div>

      <div id="f2f-ass-bucket" style="margin-top:-1px;display:nones">
        <div
          id="f2f-bucket"
          style="display:grid;grid-template-columns:1fr 1fr;column-gap:20px;row-gap:8px;padding:4px 8px;border:1px solid #234;height:200px;overflow-y:auto;">
          {assessors.map((a) => (
            <p id={`f2f-ass-${a.id}`} class="f2f-ass-item">
              {a.fullname}
            </p>
          ))}
        </div>
      </div>
      {/* <div style="font-size:.75rem;font-family:sans-serif;text-align:center;">
        <span
          onclick="toggleF2FBucket()"
          style="display:inline-block;margin:0 auto;padding:4px;width:100px;background:#ebebeb;cursor:default;">
          HIDE BUCKET
        </span>
      </div> */}
      <form
        style="margin:1rem 0;text-align:center"
        method="post"
        action="/htmx/test-f2f"
        >
        <input type="hidden" name="batch_id" value={batch.id} />
        <input
          readonly
          id="f2f-ass-id-list"
          type="text"
          name="f2f_ass_ids"
          style="display:block;width:100%;text-align:center;color:#89a"
        />
        <div style="padding:.5rem;display:flex;justify-content: center;gap:.5rem">
          <button id="btn-f2f-ass" disabled>SAVE</button>
          <button disabled>SAVE &amp; ALLOCATE</button>
        </div>
      </form>
      {html` <script>
        let AGMAX = ${maxf2f};
      </script>`}
    </Layout>
  );
})

export { bat }