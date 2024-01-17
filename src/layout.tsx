import { Context } from "hono";
import { html, raw } from "hono/html";

const js = (slug: string) => {
  return `(function (){
    const form = document.getElementById("form")
    const username = document.getElementById("username")
    const password = document.getElementById("password")
    const err = document.getElementById("err")
    const url = '/login/${slug}'

    function change(e) { err.innerText = '' }

    async function login(event) {
      event.preventDefault();
      if (username.value.length > 0 && password.value.length > 0) {
        // const response = await fetch(url);
        const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify({
            username: username.value,
            password: password.value,
          }),
        });

        const json = await response.json()
        if (response.ok) {
          // document.location.href = '/whoami'
          document.location.href = '/selftest'
        } else {
          console.log(json);
          err.innerText = json.info;
          return;
        }
      }
    }

    form.addEventListener("submit", login)
    username.addEventListener("input", change)
    password.addEventListener("input", change)
  }())`;
};

const Layout = (props: { title: string; slug: string; children?: any }) => {
  const script = js(props.slug);

  return html`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${props.title}</title>
      </head>
      <body>
        <turbo-frame id="main">${props.children}</turbo-frame>
        <script>
          ${raw(script)};
        </script>
      </body>
    </html>`;
};

const Page = (props: { title: string; slug: string }) => {
  return (
    <Layout title={props.title} slug={props.slug}>
      <h3 id="h3" style="margin-bottom:.5rem">
        {props.title}
      </h3>
      <form id="form" method="post">
        <p style="margin:.5rem 0">
          <span style="display:inline-block;width:90px;">Username:</span>
          <input id="username" type="text" name="username" autofocus />
        </p>
        <p style="margin:.5rem 0">
          <span style="display:inline-block;width:90px;">Password:</span>
          <input id="password" type="text" name="password" />
        </p>
        <p style="margin:.5rem 0">
          <span style="display:inline-block;width:90px;"></span>
          <button type="submit">Login</button>
          <span id="err" style="margin-left:.5rem;color:red"></span>
        </p>
      </form>
    </Layout>
  );
};

export async function Signin(c: Context, slug: string) {
  const title = "Aces Tests Login: " + slug;
  return c.html(<Page title={title} slug={slug} />);
}

// export async function CORSLogin(c: Context) {
//   return c.html(<Page title="Aces Demo Login - CORS" />);
// }
