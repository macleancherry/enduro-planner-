import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import type { Env } from "../env";
import { getDb } from "../db";
import { race, raceDriver, stint } from "../../db/schema";
import { raceInputSchema } from "../../shared/validation";
import { generateSchedule } from "../../shared/raceMath";

export const raceRoutes = new Hono<{ Bindings: Env }>();

raceRoutes.get("/races", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db.select().from(race).orderBy(asc(race.startTimeUtc)).all();
  return c.json({ races: rows });
});

raceRoutes.post("/races", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = raceInputSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const { driverIds, ...raceFields } = parsed.data;

  const [createdRace] = await db
    .insert(race)
    .values({
      ...raceFields,
      subsessionId: raceFields.subsessionId ?? null,
    })
    .returning();

  await db.insert(raceDriver).values(
    driverIds.map((driverId, index) => ({
      raceId: createdRace.id,
      driverId,
      order: index,
    }))
  );

  return c.json({ race: createdRace }, 201);
});

raceRoutes.get("/races/:raceId", async (c) => {
  const db = getDb(c.env.DB);
  const raceId = c.req.param("raceId");
  const [raceRow] = await db.select().from(race).where(eq(race.id, raceId));
  if (!raceRow) return c.json({ error: "not_found" }, 404);

  const raceDrivers = await db.select().from(raceDriver).where(eq(raceDriver.raceId, raceId)).all();
  return c.json({ race: raceRow, raceDrivers });
});

raceRoutes.patch("/races/:raceId", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = raceInputSchema.partial().omit({ driverIds: true }).safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const [row] = await db
    .update(race)
    .set(parsed.data)
    .where(eq(race.id, c.req.param("raceId")))
    .returning();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({ race: row });
});

raceRoutes.post("/races/:raceId/schedule", async (c) => {
  const db = getDb(c.env.DB);
  const raceId = c.req.param("raceId");

  const [raceRow] = await db.select().from(race).where(eq(race.id, raceId));
  if (!raceRow) return c.json({ error: "not_found" }, 404);

  const existingStints = await db.select().from(stint).where(eq(stint.raceId, raceId)).all();
  if (existingStints.some((s) => s.status !== "planned")) {
    return c.json({ error: "cannot_regenerate_after_race_started" }, 409);
  }

  const raceDrivers = await db.select().from(raceDriver).where(eq(raceDriver.raceId, raceId)).all();
  if (raceDrivers.length === 0) {
    return c.json({ error: "no_drivers_assigned" }, 400);
  }

  const generated = generateSchedule(raceRow, raceDrivers);

  await db.delete(stint).where(eq(stint.raceId, raceId));

  // D1 caps bound parameters per statement (~100), and a full 24h schedule can be 25+ stints x
  // 9 columns — comfortably over that in one insert. Chunk to stay under the limit.
  const rows = generated.map((g) => ({
    raceId,
    stintNumber: g.stintNumber,
    plannedDriverId: g.plannedDriverId,
    plannedLapTimeSeconds: g.plannedLapTimeSeconds,
    plannedLaps: g.plannedLaps,
    plannedFuelPerLapLiters: g.plannedFuelPerLapLiters,
    plannedStartUtc: g.plannedStartUtc,
    plannedEndUtc: g.plannedEndUtc,
    isLikelyFinalStint: g.isLikelyFinalStint,
  }));
  const CHUNK_SIZE = 5;
  const inserted: (typeof stint.$inferSelect)[] = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const chunkInserted = await db.insert(stint).values(chunk).returning();
    inserted.push(...chunkInserted);
  }

  return c.json({ stints: inserted }, 201);
});
