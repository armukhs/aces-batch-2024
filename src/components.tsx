import { html } from "hono/html";
import type { FC } from "hono/jsx";
import { getAssessorReqs } from "./utils";

export const Layout: FC = (props) => {
  const title = props.title || "ACES Batches";
  return (
    <html>
      <head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          src="https://unpkg.com/htmx.org@1.9.10"
          integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC"
          crossorigin="anonymous"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
        <link href="/static/css/styles.css" rel="stylesheet" />
      </head>
      <body hx-ext="reset-on-success">
        <div class="page">{props.children}</div>
        <div style="height:20rem"></div>
        <script src="/static/js/htmx-form-reset.js"></script>
        <script src="/static/js/helper.js"></script>
        {(props.js && typeof props.js == "string") && <script src={props.js}></script>}
        {(props.js && Array.isArray(props.js)) && props.js.map(s => <script src={s}></script>)}
      </body>
    </html>
  );
};

export const Login = (props: { username?: string, password?: string }) => {
  return (
    <div style="width:300px;margin:0 auto">
      <h3 style="text-align:center;margin:4rem 0 1rem">Login</h3>
      <form hx-post="/login" hx-target="closest div">
        <p style="margin:.5rem 0">
          <span style="display:inline-block;width:80px;">Username:</span>
          <input id="username" value={props.username} type="text" name="username" autofocus style="width:210px" />
        </p>
        <p style="margin:.5rem 0">
          <span style="display:inline-block;width:80px;">Password:</span>
          <input id="password" value={props.password} type="password" name="password" style="width:210px" />
        </p>
        <p style="margin:1rem 0;text-align:center">
          <button type="submit" style="width:80px;height:32px;">
            LOGIN
          </button>
        </p>
        {(props.username || props.password) && (
          <p style="margin:.75rem 0;color:red;text-align:center">🤬 Username dan/atau password salah</p>
        )}
      </form>
      {html`
        <script>
          document.body.addEventListener("loggedIn", function (evt) {
            document.location = "/org";
          });
        </script>
      `}
    </div>
  );
}

export const MainMenu = () => {
  return (
    <div id="main-menu">
      <a href="/org">
        Orglist
      </a>
      {` — `}
      <a href="/bat">
        Batch
      </a>
      {` — `}
      <a href="/ass">
        Asesor
      </a>
      {` — `}
      <a href="/mod">
        Modul
      </a>
      {` — `}
      <a href="/adm">
        Admin
      </a>
    </div>
  );
}

export const BatchHero = (props: { batch: VBatch }) => (
  <h1>
    <span class="sub">Batch {props.batch.id}</span>
    <span class="org">{props.batch.org_name}</span>
    <div style="display:flex;align-items:center;gap:.5rem;">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        style="display:inline-block;width:24px;height:24px;margin-top:-2px">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
        />
      </svg>
      {props.batch.date}
    </div>
  </h1>
);

export const BatchMenu = (props: { id: number, current: string }) => {
  if (!['', 'peserta', 'asesor'].includes(props.current)) return <p>MENU ERROR</p>
  return (
    <div class="batch-menu">
      {props.current == "" ? <span class="current">Settings</span> : <a href={`/bat/${props.id}`}>Settings</a>}
      <span>/</span>
      {props.current == "peserta" ? (
        <span class="current">Peserta</span>
      ) : (
        <a href={`/bat/${props.id}/peserta`}>Peserta</a>
      )}
      <span>/</span>
      {props.current == "asesor" ? (
        <span class="current">Asesor</span>
      ) : (
        <a href={`/bat/${props.id}/asesor`}>Asesor</a>
      )}
    </div>
  );
}

export const OrgList = (props: { orgs: VOrganization[] }) => {
  return (
    <table id="org-list">
      <thead>
        <tr style="font-weight:600">
          <td>Nama</td>
          <td>Batch</td>
          <td>Head</td>
          <td>Year</td>
          <td>...</td>
        </tr>
        <TRHR colspan={5} />
      </thead>
      {props.orgs.map((o) => <OrgRow org={o} />)}
    </table>
  );
};

export const OrgRow = (props: { org: VOrganization }) => {
  const org = props.org
  return (
    <tbody>
      <tr>
        <td>
          <a href={`/org/${org.id}`}>{org.name}</a>
        </td>
        <td>{org.batches || "-"}</td>
        <td>{org.heads || "-"}</td>
        <td>&nbsp;{org.last_batch?.substring(0, 4) || "-"}&nbsp;</td>
        <td>
          <button
            class="btn-new-batch"
            hx-get={`/htmx/org/${org.id}/new-batch`}
            hx-target="closest tbody"
            hx-swap="outerHTML"
            onclick="document.querySelectorAll('.btn-new-batch').forEach(e => e.setAttribute('disabled', true))">
            +
          </button>
        </td>
      </tr>
    </tbody>
  );
}

export const FormBatch = (props: { org: VOrganization }) => {
  const org = props.org;
  return (
    <tbody>
      <tr style="background:#ebebeb;color:black">
        <td style="">{org.name}</td>
        <td>{org.batches || "-"}</td>
        <td>{org.heads || "-"}</td>
        <td>&nbsp;{org.last_batch?.substring(0, 4) || "-"}&nbsp;</td>
        <td>
          <button disabled class="btn-new-batch">
            +
          </button>
        </td>
      </tr>
      <tr>
        <td colspan={5}>
          <form style="margin:0" method="post" action="/org">
            <span>&rarr; Create Batch: </span>
            <input type="hidden" name="id" value={props.org.id} />
            <input
              type="text"
              name="date"
              size={12}
              placeholder="YYYY-MM-DD"
              autofocus
              escapedby="cancel-batch"
              onkeydown="__handleEsc(event)"
              style="margin-right:0.5rem"
            />
            <button>SUBMIT</button>
            {` `}
            <button
              id="cancel-batch"
              hx-get={`/htmx/org/${props.org.id}`}
              hx-target="closest tbody"
              hx-swap="outerHTML"
              onclick="document.querySelectorAll('.btn-new-batch').forEach(e => e.removeAttribute('disabled'))">
              CANCEL
            </button>
          </form>
        </td>
      </tr>
    </tbody>
  );
};

export const FormOrg = () => (
  <div style="text-align:center;margin-top:3rem">
    <button
      id="btn-new-org"
      onclick="document.getElementById('btn-new-org').style.display='none';document.getElementById('org-form').style.display='block';document.getElementById('org-name').focus()">
      NEW ORGANIZATION
    </button>
    <form
      id="org-form"
      style="margin:0;display:none;"
      hx-post="/htmx/org"
      hx-target="#org-list"
      hx-swap="beforeend"
      hx-reset-on-success>
      <input
        type="text"
        id="org-name"
        name="name"
        placeholder="Nama perusahaan/organisasi"
        style="width:270px"
        __onkeydown="escOrg(event)"
        escapedby="cancel-org"
        onkeydown="__handleEsc(event)"
      />
      <button style="margin-left:0.5rem">SUBMIT</button>
      <button
        id="cancel-org"
        type="button"
        style="margin-left:0.5rem"
        onclick="document.getElementById('org-form').style.display='none';document.getElementById('btn-new-org').style.display='inline-block';">
        CANCEL
      </button>
    </form>
  </div>
);

export const TRHR = (props: { colspan: number }) => (
  <tr>
    <td colspan={props.colspan} style="height:0.25rem;padding:2px 0">
      <hr />
    </td>
  </tr>
);

export const BatchSettings = (props: { batch: VBatch }) => {
  const batch = props.batch;
  const VData = (props: { l: string; v: any }) => (
    <tr>
      <td width="140">{props.l}:</td>
      {props.v ? (<td><b>{props.v}</b></td>) : (<td style="color:#789"> - N/A</td>)}
    </tr>
  );
  return (
    <div id="batch-settings" style="">
      <div style="display:flex;align-items:center;margin-bottom:0.5rem">
        <h3 style="margin:0;flex-grow:1">Tanggal &amp; Modul</h3>
        <button
          id="btn-edit"
          type="button"
          hx-get={`/htmx/batch-settings-form/${batch.id}`}
          hx-target="#batch-settings"
          hx-swap="outerHTML">
          EDIT
        </button>
      </div>
      <table cellspacing={0}>
        <tbody>
          <TRHR colspan={2} />
          <VData l="Tanggal" v={batch.date} />
          <TRHR colspan={2} />
          <VData l="Modul Selftest" v={batch.mod_self} />
          <VData l="Modul Case-Based" v={batch.mod_case} />
          <VData l="Modul FaceToFace" v={batch.mod_f2f} />
          <VData l="Modul InGroup" v={batch.mod_lgd} />
          <TRHR colspan={2} />
          <VData l="Tipe Slot" v={batch.mode} />
          <VData l="Batch Split" v={batch.split} />
          <TRHR colspan={2} />
        </tbody>
      </table>
    </div>
  );
};

export const FormBatchSettings = (props: { batch: VBatch, tools: Tools[] }) => {
  const batch = props.batch;
  const tools = props.tools;
  const FData = (props: { l: string, children: any }) => (
    <tr>
      <td>{props.l}</td>
      <td>{props.children}</td>
    </tr>
  )
  const Option = (props: { v: string; l: string; c: string | null }) => {
    return props.v == props.c
      ? <option selected value={props.v}>{props.l}</option>
      : <option value={props.v}>{props.l}</option>;
  };
  const Radio = (props: { v: number; c: boolean }) => {
    return (
      <label style="margin-right:.5rem">
        <span>{props.v} </span>
        {props.c && <input checked id={`split${props.v}`} type="radio" name="split" value={props.v} />}
        {!props.c && <input id={`split${props.v}`} type="radio" name="split" value={props.v} />}
      </label>
    );
  };
  return (
    <div id="batch-settings" style="">
      <form hx-put="/htmx/batch-settings" hx-target="#batch-briefs" hx-swap="outerHTML">
        <input id="batch-id" type="hidden" name="id" value={batch.id} />
        <input id="batch-mode" type="hidden" name="mode" value={batch.mode || ""} />
        <div style="display:flex;align-items:center;margin-bottom:0.5rem">
          <h3 style="margin:0;flex-grow:1">Tanggal &amp; Modul</h3>
          <div style="display:flex;align-items:center;gap:.5rem">
            <button id="modules-submit" disabled type="submit">
              SAVE
            </button>
            <button
              id="cancel-settings"
              type="button"
              hx-get={`/htmx/batch-settings/${batch.id}`}
              hx-target="#batch-settings"
              hx-swap="outerHTML">
              CANCEL
            </button>
          </div>
        </div>
        <table id="batch-settings" cellspacing={0}>
          <tbody>
            <TRHR colspan={2} />
            <FData l="Tanggal">
              <input
                id="date"
                type="text"
                autofocus
                name="date"
                value={batch.date}
                style="width:120px"
                escapedby="cancel-settings"
                onkeydown="__handleEsc(event)"
              />
            </FData>
            <TRHR colspan={2} />
            <FData l="Modul Selftest">
              <select id="mod-self" name="onSelf" escapedby="cancel-settings" onkeydown="__handleEsc(event)">
                <Option v="" l="- Not Set -" c={batch.on_self} />
                {tools
                  .filter((t) => t.category == "self")
                  .map((t) => (
                    <Option v={t.id} l={t.title} c={batch.on_self} />
                  ))}
              </select>
            </FData>
            <FData l="Modul Case-Based">
              <select id="mod-case" name="onCase" escapedby="cancel-settings" onkeydown="__handleEsc(event)">
                <Option v="" l="- Not Set -" c={batch.on_case} />
                {tools
                  .filter((t) => t.category == "case")
                  .map((t) => (
                    <Option v={t.id} l={t.title} c={batch.on_case} />
                  ))}
              </select>
            </FData>
            <FData l="Modul FaceToFace">
              <select id="mod-f2f" name="onF2f" escapedby="cancel-settings" onkeydown="__handleEsc(event)">
                <Option v="" l="- Not Set -" c={batch.on_f2f} />
                {tools
                  .filter((t) => t.category == "f2f")
                  .map((t) => (
                    <Option v={t.id} l={t.title} c={batch.on_f2f} />
                  ))}
              </select>
            </FData>
            <FData l="Modul InGroup">
              <select id="mod-group" name="onGroup" escapedby="cancel-settings" onkeydown="__handleEsc(event)">
                <Option v="" l="- Not Set -" c={batch.on_lgd} />
                {tools
                  .filter((t) => t.category == "lgd")
                  .map((t) => (
                    <Option v={t.id} l={t.title} c={batch.on_lgd} />
                  ))}
              </select>
            </FData>
            <TRHR colspan={2} />
            <tr>
              <td width="110">Tipe Slot:</td>
              <td>
                <span id="batch-mode-span">{batch.mode}</span>
              </td>
            </tr>
            <tr>
              <td width="140">Batch Split:</td>
              <td>
                <Radio v={1} c={batch.split == 1} />
                <Radio v={2} c={batch.split == 2} />
                <Radio v={3} c={batch.split == 3} />
                <Radio v={4} c={batch.split == 4} />
              </td>
            </tr>
            <TRHR colspan={2} />
          </tbody>
        </table>
        {html`<script>
          setTimeout(() => __setting(), "500");
        </script>`}
      </form>
    </div>
  );
}

export const BatchPersons = (props: { batch: VBatch; groups: VGroup[] }) => {
  if (!props.batch.modules) return <></>;
  if (!props.batch.persons || props.batch.persons == 0) {
    return <EmptyPersons batch_id={props.batch.id} org_id={props.batch.org_id} />;
  }
  return (
    <div id="batch-persons">
      <h3>Peserta Batch</h3>
      <p style="margin:.75rem 0 .5rem">
        Jumlah peserta <b>{props.batch.persons} orang</b>, terbagi dalam <b>{props.batch.groups} grup</b> dan jadwal
        sbb:
      </p>
      <BatchGroups groups={props.groups} />
      <p style="margin:.5rem 0">
        <span>Daftar lengkap peserta per grup </span>
        <a style="" href={`/bat/${props.batch.id}/peserta`}>
          dapat dilihat di sini
        </a>
        .
      </p>
    </div>
  );
};

export const EmptyPersons = (props: { batch_id: number; org_id: number }) => {
  return (
    <div id="batch-persons">
      <div style="display:flex;align-items:center;margin:2.5rem 0 .5rem">
        <h3 style="margin:0;flex-grow:1">Peserta Batch</h3>
        <button id="btn-upload">UPLOAD DATA</button>
      </div>
      <p id="empty" style="line-height:24px;">
        Belum ada data peserta
      </p>
      {/* <form id="upload-form" hx-post="/htmx/upload" hx-target="#empty" hx-swap="outerHTML" style="display:none"> */}
      <form
        id="upload-form"
        hx-post="/htmx/upload"
        hx-target="#batch-persons-assessors"
        hx-swap="outerHTML"
        style="display:none">
        <div style="display:flex;align-items:center;gap:.25rem">
          <span>Jumlah sample:</span>
          <input type="hidden" name="org_id" value={props.org_id} />
          <input type="hidden" name="batch_id" value={props.batch_id} />
          <input
            id="samplenum"
            type="number"
            name="samplenum"
            value={28}
            style="margin-left:0.25rem;width:50px"
            escapedby="cancel-upload"
            onkeydown="__handleEsc(event)"
          />
          <button style="margin-left:0.25rem">CREATE</button>
          <button type="button" id="cancel-upload" style="margin-left:0.25rem">
            CANCEL
          </button>
        </div>
      </form>
      {html`
        <script>
          document.getElementById("btn-upload").addEventListener("click", (e) => {
            document.getElementById("empty").style.display = "none";
            document.getElementById("upload-form").style.display = "block";
            document.getElementById("btn-upload").setAttribute("disabled", true);
            document.getElementById("samplenum").focus();
          });
          document.getElementById("cancel-upload").addEventListener("click", (e) => {
            document.getElementById("upload-form").style.display = "none";
            document.getElementById("empty").style.display = "block";
            document.getElementById("btn-upload").removeAttribute("disabled");
          });
        </script>
      `}
    </div>
  );
};

export const BatchGroups = (props: { groups: VGroup[] }) => {
  const GroupTd = (props: { v:any }) => {
    // return props.v ? <td class="group-slot">{props.v}</td> : <td class="group-slot blank"></td>;
    if (!props.v) return <td class="group-slot blank"></td>;
    return <td class={`group-slot ${props.v}`}>{props.v}</td>;
  }
  return (
    <table class="grouping">
      <thead>
        <tr>
          <td>Grup</td>
          <td width={20}>JA</td>
          <td>Slot 1</td>
          <td>Slot 2</td>
          <td>Slot 3</td>
          <td>Slot 4</td>
        </tr>
      </thead>
      <tbody>
        {props.groups.map((g: VGroup) => (
          <tr>
            <td>Grup {g.name.split(" ")[1]}</td>
            <td align="center">{g.members}</td>
            <GroupTd v={g.slot1} />
            <GroupTd v={g.slot2} />
            <GroupTd v={g.slot3} />
            <GroupTd v={g.slot4} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const BatchAssessors = (props: { batch: VBatch; ass_reqs: ExpertReqs|null }) => {
  if (!props.batch.modules) return <></>;
  if (props.batch.persons == 0) return <></>;
  const need_assessors = props.batch.need_assessors > 0;
  const { minf2f, minlgd, maxf2f, maxlgd } = getAssessorReqs(props.ass_reqs)
  return (
    <div id="batch-assessors">
      <h3 style="margin-bottom:0.5rem">Kebutuhan Asesor</h3>
      {!need_assessors && <p>Batch ini tidak memerlukan asesor.</p>}
      {need_assessors && (
        <>
          <ReqsTable req={props.ass_reqs} />
          <p style="margin:.5rem 0">
            <span>Pemenuhan dan pengaturan asesor dapat </span>
            <a style="" href={`/bat/${props.batch.id}/asesor`}>
              dilakukan di sini
            </a>
            .
          </p>
        </>
      )}
      {/*  */}
    </div>
  );
};

const AssessorsAllocation = (props: { batch_id: number, type: string, title: string, min: number, max?: number}) => {
  const { batch_id, type, title, min, max } = props;
  return (
    <div>
      <h4 style="font-size:1.125em;margin-top:1.5rem">{title}</h4>
      <hr style="margin:0.5rem 0" />
      {min == 0 && <p>Batch ini tidak membutuhkan asesor {type}.</p>}
      {min > 0 && (
        <div style="padding:3rem;text-align:center">
          <button>SELECT ASSESSORS</button>
        </div>
      )}
    </div>
  );
};

export const ReqsTable = (props: { req: ExpertReqs | null }) => {
  let minlgd = 0,
    maxlgd = 0,
    minf2f = 0,
    maxf2f = 0;
  if (props.req) {
    const x = getAssessorReqs(props.req);
    minlgd = x.minlgd;
    maxlgd = x.maxlgd;
    minf2f = x.minf2f;
    maxf2f = x.maxf2f;
  }
  return (
    <table>
      <thead>
        <tr>
          <td class="border-b">Jenis Asesor</td>
          <td class="center border-b">Minimum</td>
          <td class="center border-b">Maksimum</td>
          <td class="center border-b">Tersedia</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Asesor Grup:</td>
          <td class="center">{"" + minlgd}</td>
          <td class="center">{"" + maxlgd}</td>
          <td class="center">-</td>
        </tr>
        <tr>
          <td>Asesor Individu:</td>
          <td class="center">{"" + minf2f}</td>
          <td class="center">{"" + maxf2f}</td>
          <td class="center">-</td>
        </tr>
        <tr>
          <td class="border-b">Case Reviewer</td>
          <td class="center border-b">-</td>
          <td class="center border-b">-</td>
          <td class="center border-b">-</td>
        </tr>
      </tbody>
    </table>
  );
};

export const BatchList = (props: { batches: VBatch[] }) => {
  return (
    <table class="batch-list">
      <thead>
        <tr>
          <td style="background:">Tanggal</td>
          <td style="background:">Organisasi</td>
          <td style="background:">Modul</td>
          <td style="background:">Peserta</td>
        </tr>
      </thead>
      <tbody>
        {props.batches.map((b) => (
          <tr>
            <td>{b.date || '-'}</td>
            <td>
              <a href={`/bat/${b.id}`}>{b.org_name}</a>
            </td>
            <td align="center">{b.modules || '-'}</td>
            <td align="center">{b.persons || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const FormSamplePersons = (props: { batchId: number }) => {
  return (
    <div id="batch-persons">
      <h3>
        <span>Peserta</span>
      </h3>
      <div>
        <form hx-post={`/batches/${props.batchId}/create-sample`} hx-target="#batch-persons" hx-swap="outerHTML">
          <span>Masukkan jumlah sample:</span>
          <input type="number" name="sampleLength" style="width:3rem;margin-left:1rem" />
          <button type="submit" style="margin-left:1rem">
            CREATE SAMPLE
          </button>
        </form>
      </div>
    </div>
  );
};

export const _BatchPersons = (props: { batchId:number, personsNum: number }) => {
  // if (props.personsNum == 0) return <EmptyPersons batch_id={props.batchId} />
  return (
    <div id="batch-persons">
      <h3>
        <span>Peserta</span>
      </h3>
      <div>
        <span>Tercatat {props.personsNum} peserta, </span>
        <a href={`/batches/${props.batchId}/peserta`}>klik unutk lihat daftar</a>.
      </div>
    </div>
  );
};

// DEL
export const SectionPeserta = (props: { batch: VBatch }) => {
  if (props.batch.persons > 0) return (
    <div>
      <span>Tercatat {props.batch.persons} peserta. &rarr; </span>
      <a style="color:blue" href={`/bat/${props.batch.id}/peserta`}>
        Lihat Daftar
      </a>
    </div>
  );
  return (
    <div id="upload-target">
      <div id="upload">
        <div style="margin-bottom:0.25rem">Belum ada data peserta</div>
        <button id="btn-upload">UPLOAD DATA</button>
      </div>
      <form id="upload-form" hx-post="/htmx/upload" hx-target="#upload-target" hx-swap="outerHTML" style="display:none">
        <div style="margin-bottom:0.25rem">Masukkan jumlah sample untuk batch ini</div>
        <span>Jumlah sample:</span>
        <input type="hidden" name="_method" value="upload" />
        <input type="hidden" name="batch_id" value={props.batch.id} />
        <input
          id="samplenum"
          type="number"
          name="samplenum"
          value={28}
          style="margin-left:0.25rem;width:50px"
          escapedby="cancel-upload"
          onkeydown="__handleEsc(event)"
        />
        <button style="margin-left:0.25rem">CREATE</button>
        <button type="button" id="cancel-upload" style="margin-left:0.25rem">
          CANCEL
        </button>
      </form>
      {html`
        <script>
          document.getElementById("btn-upload").addEventListener("click", (e) => {
            document.getElementById("upload").style.display = "none";
            document.getElementById("upload-form").style.display = "block";
            document.getElementById("samplenum").focus();
          });
          document.getElementById("cancel-upload").addEventListener("click", (e) => {
            document.getElementById("upload-form").style.display = "none";
            document.getElementById("upload").style.display = "block";
          });
        </script>
      `}
    </div>
  );
}

export const PersonsTable = (props: { groups: GroupWithMembers[] }) => {
  return (
    <table class="peserta-batch">
      {props.groups.map((g: GroupWithMembers, i: number) => (
        <tbody>
          <tr>
            <td colspan={3}>
              <h4 style="margin:0.5rem 0">
                {g.name} ({g.members.length} orang)
              </h4>
            </td>
          </tr>
          {g.members.map((p: VPerson, j: number) => (
            <tr>
              <td>{g.startBy + j}</td>
              <td>{p.fullname}</td>
              <td>{p.f2f_assessor_name}</td>
              <td>
                <form hx-delete="/htmx/peserta" hx-target="#batch-persons" hx-swap="outerHTML" style="margin:0">
                  <input type="hidden" name="_method" value="delete" />
                  <input type="hidden" name="person_id" value={p.id} />
                  <input type="hidden" name="batch_id" value={p.batch_id} />
                  <button>DELETE</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}

export const Slotmap = (props: { slot: number }) => {
  function Slot(props: { order:number, slot:number}) {
    return (props.order == props.slot) ? <div class="slot"></div> : <div></div>;
  }
  return (
    <div class="slotmap">
      <Slot order={1} slot={props.slot} />
      <Slot order={2} slot={props.slot} />
      <Slot order={3} slot={props.slot} />
      <Slot order={4} slot={props.slot} />
    </div>
  );
}

export const GroupAssessors = (props: {
  batch_id: string;
  groups: VGroup[];
  bucket: AssessorWithSlot[];
  disabled?: boolean;
}) => {
  // TODO: handle batch without LGD
  return (
    <div id="group-assessors">
      <div style="display:flex;align-items:center;margin-top:2.5rem">
        <h3 style="flex-grow:1;margin:0">Asesor Grup</h3>
        <button disabled id="btn-group-refresh" style="background:transparent;opacity:0.5" onclick="undoGroupChanges()">
          <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 7H15C16.8692 7 17.8039 7 18.5 7.40193C18.9561 7.66523 19.3348 8.04394 19.5981 8.49999C20 9.19615 20 10.1308 20 12C20 13.8692 20 14.8038 19.5981 15.5C19.3348 15.9561 18.9561 16.3348 18.5 16.5981C17.8039 17 16.8692 17 15 17H8.00001M4 7L7 4M4 7L7 10"
              stroke="#1C274C"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <hr style="margin:0.5rem 0" />

      <input
        type="radio"
        name="group_id"
        id="fake-radio"
        style="display:none"
        onclick="document.getElementById('df-assessors').style.display='none'"
      />
      {/* Group viewer */}
      <table id="asesor-grup" style="margin:.5rem 0">
        <tbody>
          {props.groups.map((g) => (
            <tr>
              <td width={55}>{g.name}</td>
              <td width={15}>({g.members})</td>
              <td width={100}>
                <Slotmap slot={g.plgd} />
              </td>
              <td width="20">
                <input
                  disabled={props.disabled}
                  class="ag-radio"
                  type="radio"
                  name="group_id"
                  value={g.id}
                  slot={"s" + g.plgd}
                />
              </td>
              <td>
                <form
                  style="display:flex;align-items:center;gap:.5rem"
                  hx-post={`/htmx/bat/${props.batch_id}/asesor`}
                  hx-target="this"
                  hx-swap="outerHTML">
                  <input type="hidden" name="batch_id" value={props.batch_id} />
                  <input type="hidden" name="group_id" value={g.id} />
                  <input type="hidden" name="slot" value={g.plgd} />
                  <input
                    _id={`ass-${g.id}`}
                    id={`lgd_ass_id-${g.id}`}
                    class="input-lgd-ass-id"
                    _value={`${g.lgd_ass_id}`}
                    value={`${g.lgd_ass_id}`}
                    type="hidden"
                    name="lgd_ass_id"
                  />
                  <input
                    readonly
                    class="ag-input"
                    style="flex-grow:1"
                    type="text"
                    radio={`radio-${g.id}`}
                    group_id={g.id}
                    ass_id={g.lgd_ass_id}
                    slot={"" + g.plgd}
                    name="fullname"
                    id={`name-${g.id}`}
                    value={g.lgd_assessor_name || ""}
                    _value={g.lgd_assessor_name || ""}
                    onfocus="document.getElementById('fake-radio').click()"
                  />
                  <button class="btn-group-item" disabled>
                    OK
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Assessors tray */}
      <div id="df-assessors" style="display:none">
        <div style="border:1px solid #666;padding:4px 8px;height:200px;line-height:1.5;overflow-y:scroll">
          {props.bucket.map((a) => (
            <p class="ass-names" ass_id={a.id} s1={a.slot1} s2={a.slot2} s3={a.slot3} s4={a.slot4}>
              {a.fullname}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

// export const