import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { Env } from "../env";
import { getDb } from "../db";
import { driver } from "../../db/schema";
import { driverInputSchema } from "../../shared/validation";

export const driverRoutes = new Hono<{ Bindings: Env }>();

driverRoutes.get("/drivers", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db.select().from(driver).all();
  return c.json({ drivers: rows });
});

driverRoutes.post("/drivers", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = driverInputSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const [row] = await db
    .insert(driver)
    .values({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      customerId: parsed.data.customerId ?? null,
    })
    .returning();
  return c.json({ driver: row }, 201);
});

driverRoutes.patch("/drivers/:driverId", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = driverInputSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const [row] = await db
    .update(driver)
    .set(parsed.data)
    .where(eq(driver.id, c.req.param("driverId")))
    .returning();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({ driver: row });
});

driverRoutes.delete("/drivers/:driverId", async (c) => {
  const db = getDb(c.env.DB);
  await db.delete(driver).where(eq(driver.id, c.req.param("driverId")));
  return c.json({ ok: true });
});
