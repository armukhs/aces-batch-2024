import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { unsealData } from "iron-session";

export async function getSessionUser(c: Context) {
  // Test user uses cookie
  const cookie = getCookie(c, c.env.COOKIE_NAME)
  if (cookie) {
    const user = await unsealData(cookie, { password: c.env.COOKIE_PASSWORD })

    // Validate shape
    const { id, username, fullname, email } = user as Admin;
    if (id && fullname && username) return user as Admin;
  }

  return null;
}