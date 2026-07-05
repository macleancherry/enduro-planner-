import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";
import { verifyAuthCookie } from "../auth";

export const passcodeGate: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const ok = await verifyAuthCookie(c.req.header("Cookie") ?? null, c.env.PASSCODE_HMAC_SECRET);
  if (!ok) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
};
