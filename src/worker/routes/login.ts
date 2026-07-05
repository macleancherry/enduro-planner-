import { Hono } from "hono";
import type { Env } from "../env";
import { createAuthCookie, clearAuthCookie, verifyPasscode } from "../auth";
import { loginSchema } from "../../shared/validation";

export const loginRoutes = new Hono<{ Bindings: Env }>();

loginRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "invalid_request" }, 400);
  }

  const ok = await verifyPasscode(parsed.data.passcode, c.env.PASSCODE);
  if (!ok) {
    return c.json({ error: "invalid_passcode" }, 401);
  }

  const isHttps = new URL(c.req.url).protocol === "https:";
  const cookie = await createAuthCookie(c.env.PASSCODE_HMAC_SECRET, isHttps);
  c.header("Set-Cookie", cookie);
  return c.json({ ok: true });
});

loginRoutes.post("/logout", async (c) => {
  c.header("Set-Cookie", clearAuthCookie());
  return c.json({ ok: true });
});
