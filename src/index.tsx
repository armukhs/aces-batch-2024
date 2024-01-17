import { Hono } from "hono";
import { html } from "hono/html";
import { serveStatic } from "hono/cloudflare-workers";
import { setCookie, deleteCookie } from "hono/cookie";
import { sealData } from "iron-session";
import { FormOrg, Layout, Login, MainMenu, OrgList, TRHR } from "./components";
import { htmx } from "./htmx";
import { getSessionUser } from "./session";
import { bat } from "./batch";

const app = new Hono<{ Bindings: Env }>()
app.use("/static/*", serveStatic({ root: "./" }));
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const end = Date.now();
  c.res.headers.set("X-Response-Time", `${end - start}`);
});

app.use("/htmx/*", async (c, next) => {
  if (!(await getSessionUser(c))) return c.notFound();
  await next();
});

app.use("*", async (c, next) => {
  const pathname = new URL(c.req.raw.url).pathname;
  const paths = ["/org", "/bat", "/mod", "/ass", "/adm"];
  if (paths.includes(pathname.substring(0,4))) {
    if (!(await getSessionUser(c))) return c.redirect("/");
  }
  await next();
})

// app.use(["/org", "/bat", "/mod", "/ass", "/adm"], (c, next) => {});

// Home
app.get('/', async (c) => {
  const user = await getSessionUser(c);
  if (user) return c.redirect("/org");
  return c.html(
    <Layout>
      <Login />
    </Layout>
  );
})

app.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const username = body.username as string;
  const password = body.password as string;
  const stm0 = `SELECT * FROM admins WHERE username=?`;
  const user = (await c.env.DB.prepare(stm0).bind(username).first()) as Admin;
  if (!user || password != username) {
    return c.html(<Login username={username} password={password} />);
  }
  const sealedData = await sealData(user, { password: c.env.COOKIE_PASSWORD });
  setCookie(c, c.env.COOKIE_NAME, sealedData, { path: "/" });
  c.status(200);
  // c.res.headers.append("Access-Control-Allow-Origin", "*");
  c.res.headers.append("HX-Trigger", "loggedIn");
  return c.text("");
});

app.post("/logout", async (c) => {
  deleteCookie(c, c.env.COOKIE_NAME, { path: "/" });
  return c.redirect("/");
});

app.get("/whoami", async (c) => {
  const user = await getSessionUser(c);
  if (user) return c.json(user);
  return c.text("Illegal alien")
})

app.get("/pragma/:table", async (c) => {
  const table = c.req.param("table");
  const sql = `PRAGMA table_info('${table}')`;
  const rs = await c.env.DB.prepare(sql).all();
  if (rs.results?.length) return c.json(rs.results);
  return c.json(null, 404);
});

app.get("/tables", async (c) => {
  const sql = "SELECT name FROM sqlite_schema WHERE type=?";
  const [rs1, rs2] = await c.env.DB.batch([c.env.DB.prepare(sql).bind("table"), c.env.DB.prepare(sql).bind("view")]);

  const tables = rs1?.results?.map((row: any) => row.name);
  const views = rs2?.results?.map((row: any) => row.name);
  return c.json({ tables, views });
});

// Test returning text as js
app.get("/df-asesor", async (c) => {
  const stm = `SELECT * FROM assessors`;
  const rs = await c.env.DB.prepare(stm).all();
  const objs = rs.results as Assessor[]
  let js = `/** DF ASESOR ${new Date().toISOString()} */ const ACES_ASTRAY={`;
  objs.forEach((d,i) => {
    if (i>0) js += ",";
    js += `${d.id}:{id:${d.id},fn:"${d.fullname}",s1:null,s2:null,s3:null,s4:null}`;
  })
  js += `};
      document.querySelectorAll("[name=group_id]").forEach((elm) => {
      elm.removeAttribute("disabled");
    });
  `;

  c.header("Content-Type", "text/javascript; charset=utf-8");
  c.res.headers.append("HX-Trigger", "ASSESSORSLOADED");
  return c.body(js);
})

app.get("/test/:id", async (c) => {
  const id = c.req.param("id");
  console.log("req", c.req)
  const url = new URL(c.req.raw.url);
  console.log("START", url.pathname.substring(0,4));
  return c.html(
    <div>
      ID: {id}
    </div>
  );
})

/* ORGANIZATION ================== */

app.get("/org", async (c) => {
  const stm = `SELECT * FROM v_organizations`
  const rs = await c.env.DB.prepare(stm).all();
  return c.html(
    <Layout>
      <MainMenu />
      <h1>Daftar Organisasi</h1>
      <OrgList orgs={rs.results as VOrganization[]} />
      <FormOrg />
      {html`
        <script>
          document.body.addEventListener("orgAddedEvent", function (evt) {
            document.getElementById("cancel-org").click();
          });
        </script>
      `}
    </Layout>
  );
});

// Create batch
app.post("/org", async (c) => {
  const { id, date } = await c.req.parseBody();
  const stm = `SELECT * FROM organizations WHERE id=?`;
  const rs = await c.env.DB.prepare(stm).bind(id).first();
  if (!rs) return c.notFound();
  const stm1 = `INSERT INTO batches (org_id, date, name) VALUES (?,?,?)`;
  const stm2 = `SELECT * FROM v_batches WHERE org_id=? ORDER BY id DESC LIMIT 1`;
  const res = await c.env.DB.batch([c.env.DB.prepare(stm1).bind(id, date, "BATCH"), c.env.DB.prepare(stm2).bind(id)]);
  const newBatch = res[1].results[0] as Batch;
  return c.redirect(`/bat/${newBatch.id}`);
});

// Profil org
app.get("/org/:id", async (c) => {
  const id = c.req.param("id");
  const stm0 = `SELECT * FROM v_organizations WHERE id=?`;
  const stm1 = `SELECT * FROM v_batches WHERE org_id=?`
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(id),
    c.env.DB.prepare(stm1).bind(id),
  ])
  const org = rs[0].results[0] as VOrganization;
  const batches = rs[1].results as VBatch[];
  if (!org) return c.notFound();

  const Row = (props: {l: string, v:string}) => (
    <tr><td width={120}>{props.l}:</td><td><b>{props.v}</b></td></tr>
  )
  return c.html(
    <Layout>
      <MainMenu />
      <h1>
        <span class="sub">Profil Organisasi</span>
        <span class="org">{org.name}</span>
      </h1>
      <table class="border-t" style="vertical-align:top">
        <tbody>
          {/* <TRHR colspan={2} /> */}
          <Row l="ID" v={org.id as unknown as string} />
          <Row l="Nama" v={org.name} />
          <Row l="Alamat" v={org.address || "-"} />
          <Row l="Jumlah batch" v={"" + org.batches} />
          <Row l="Jumlah persona" v={"" + org.heads} />
          <Row l="Batch pertama" v={org.first_batch || "-"} />
          <Row l="Batch terakhir" v={org.last_batch || "-"} />
        </tbody>
      </table>

      <h3>Daftar Batch</h3>
      <table class="border-b" style="margin:.75rem 0">
        <tbody>
          {/* <TRHR colspan={3} /> */}
          {batches.map((b) => (
            <tr>
              <td class="border-t">
                <a href={`/bat/${b.id}`}>Tanggal {b.date}</a>
              </td>
              <td class="border-t">{b.modules}</td>
              <td class="border-t">{b.persons}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* <pre>{JSON.stringify(batches, null, 2)}</pre> */}
    </Layout>
  );
})

/* ASSESSOR ================== */

app.get("/ass", async (c) => {
  const stm = `SELECT * FROM assessors`;
  const rs = await c.env.DB.prepare(stm).all();
  return c.html(
    <Layout>
      <MainMenu />
      <h1>Daftar Asesor</h1>
      {rs.results.map((o) => (
        <div>{o.fullname}</div>
      ))}
    </Layout>
  );
});

/* MODULES ================== */

app.get("/mod", async (c) => {
  const stm = `SELECT * FROM tools`;
  const rs = await c.env.DB.prepare(stm).all();
  const selfs = rs.results.filter((t) => t.category == "self");
  const cases = rs.results.filter((t) => t.category == "case");
  const f2fs = rs.results.filter((t) => t.category == "f2f");
  const groups = rs.results.filter((t) => t.category == "group");
  return c.html(
    <Layout>
      <MainMenu />
      <h1>Daftar Modul</h1>
      <h4 style="margin-bottom:0.5rem">Modul Self</h4>
      {selfs.map((o) => (
        <div>&bull; {o.title}</div>
      ))}
      <h4 style="margin-bottom:0.5rem">Modul Case</h4>
      {cases.map((o) => (
        <div>&bull; {o.title}</div>
      ))}
      <h4 style="margin-bottom:0.5rem">Modul F2F</h4>
      {f2fs.map((o) => (
        <div>&bull; {o.title}</div>
      ))}
      <h4 style="margin-bottom:0.5rem">Modul Group</h4>
      {groups.map((o) => (
        <div>&bull; {o.title}</div>
      ))}
    </Layout>
  );
});

/* ADMIN ================== */

app.get("/adm", async (c) => {
  return c.html(
    <Layout>
      <MainMenu />
      <h1 id="trigger">Khusus Admin</h1>

      <form method="post" action="/logout">
        <button>LOGOUT</button>
      </form>

      <table style="margin:2rem 0">
        <tbody>
          <tr>
            <td>Kebutuhan 1</td>
            <td>
              <button hx-get="/htmx/trial/1" hx-target="closest tbody" hx-swap="beforeend">
                +
              </button>
            </td>
          </tr>
        </tbody>
        <tbody>
          <tr>
            <td>Kebutuhan 2</td>
            <td>
              <button hx-get="/htmx/trial/2" hx-target="closest tbody" hx-swap="beforeend">
                +
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {html`
        <script>
          function coba(e) {
            if (e.key == "Escape") {
              // console.log(e.target.getAttribute("trigger"));
              const id = e.target.getAttribute("trigger");
              // e.target.nextSibling.click();
              document.getElementById(id).click();
            }
          }
        </script>
      `}
    </Layout>
  );
});

// Handlers for /bat, /htmx
app.route("/bat", bat)
app.route("/htmx", htmx);

export default app
// 607 -> 368