import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import type { Env } from "../env";
import { getDb } from "../db";
import { competitor, competitorStint } from "../../db/schema";
import { competitorInputSchema, competitorUpdateSchema, competitorStintInputSchema } from "../../shared/validation";

export const competitorRoutes = new Hono<{ Bindings: Env }>();

competitorRoutes.get("/races/:raceId/competitors", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db.select().from(competitor).where(eq(competitor.raceId, c.req.param("raceId"))).all();
  return c.json({ competitors: rows });
});

competitorRoutes.post("/races/:raceId/competitors", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = competitorInputSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const [row] = await db
    .insert(competitor)
    .values({ raceId: c.req.param("raceId"), name: parsed.data.name, carNumber: parsed.data.carNumber })
    .returning();
  return c.json({ competitor: row }, 201);
});

competitorRoutes.patch("/races/:raceId/competitors/:competitorId", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = competitorUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const [row] = await db
    .update(competitor)
    .set(parsed.data)
    .where(eq(competitor.id, c.req.param("competitorId")))
    .returning();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({ competitor: row });
});

competitorRoutes.delete("/races/:raceId/competitors/:competitorId", async (c) => {
  const db = getDb(c.env.DB);
  await db.delete(competitor).where(eq(competitor.id, c.req.param("competitorId")));
  return c.json({ ok: true });
});

competitorRoutes.get("/races/:raceId/competitors/:competitorId/stints", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(competitorStint)
    .where(eq(competitorStint.competitorId, c.req.param("competitorId")))
    .orderBy(asc(competitorStint.stintNumber))
    .all();
  return c.json({ stints: rows });
});

competitorRoutes.post("/races/:raceId/competitors/:competitorId/stints", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = competitorStintInputSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const [row] = await db
    .insert(competitorStint)
    .values({ competitorId: c.req.param("competitorId"), ...parsed.data })
    .returning();
  return c.json({ stint: row }, 201);
});
