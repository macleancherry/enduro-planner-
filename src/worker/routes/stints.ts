import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import type { Env } from "../env";
import { getDb } from "../db";
import { race, stint, telemetryLap } from "../../db/schema";
import { stintUpdateSchema, startStintSchema, endStintSchema } from "../../shared/validation";
import { recomputeSchedule } from "../../shared/raceMath";
import { fetchOwnCarLiveRow } from "../live";

export const stintRoutes = new Hono<{ Bindings: Env }>();

async function recomputeAndPersist(db: ReturnType<typeof getDb>, raceId: string) {
  const [raceRow] = await db.select().from(race).where(eq(race.id, raceId));
  if (!raceRow) return;
  const allStints = await db.select().from(stint).where(eq(stint.raceId, raceId)).all();

  const recomputed = recomputeSchedule(
    raceRow,
    allStints.map((s) => ({
      stintNumber: s.stintNumber,
      plannedDriverId: s.plannedDriverId,
      lapTimeOverrideSeconds: s.lapTimeOverrideSeconds,
      fuelPerLapOverride: s.fuelPerLapOverride,
      lapsOverride: s.lapsOverride,
      status: s.status,
      plannedLapTimeSeconds: s.plannedLapTimeSeconds,
      plannedLaps: s.plannedLaps,
      plannedFuelPerLapLiters: s.plannedFuelPerLapLiters,
    }))
  );

  const byNumber = new Map(allStints.map((s) => [s.stintNumber, s]));
  for (const r of recomputed) {
    const original = byNumber.get(r.stintNumber);
    if (!original || original.status === "completed") continue;
    await db
      .update(stint)
      .set({ plannedStartUtc: r.plannedStartUtc, plannedEndUtc: r.plannedEndUtc })
      .where(eq(stint.id, original.id));
  }
}

stintRoutes.get("/races/:raceId/stints", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(stint)
    .where(eq(stint.raceId, c.req.param("raceId")))
    .orderBy(asc(stint.stintNumber))
    .all();
  return c.json({ stints: rows });
});

stintRoutes.patch("/races/:raceId/stints/:stintId", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = stintUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const raceId = c.req.param("raceId");
  const [existing] = await db.select().from(stint).where(eq(stint.id, c.req.param("stintId")));
  if (!existing) return c.json({ error: "not_found" }, 404);
  if (existing.status === "completed") return c.json({ error: "stint_already_completed" }, 409);

  await db.update(stint).set(parsed.data).where(eq(stint.id, existing.id));
  await recomputeAndPersist(db, raceId);

  const [updated] = await db.select().from(stint).where(eq(stint.id, existing.id));
  return c.json({ stint: updated });
});

stintRoutes.post("/races/:raceId/stints/:stintId/start", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = startStintSchema.safeParse(body ?? {});
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const raceId = c.req.param("raceId");
  const [existing] = await db.select().from(stint).where(eq(stint.id, c.req.param("stintId")));
  if (!existing) return c.json({ error: "not_found" }, 404);
  if (existing.status !== "planned") return c.json({ error: "stint_not_planned" }, 409);

  const [raceRow] = await db.select().from(race).where(eq(race.id, raceId));
  const liveRow = raceRow ? await fetchOwnCarLiveRow(c.env, raceRow) : null;

  const [updated] = await db
    .update(stint)
    .set({
      status: "active",
      actualStartUtc: new Date().toISOString(),
      actualDriverId: parsed.data.actualDriverId ?? existing.plannedDriverId,
      fuelLevelAtStintStartLiters: liveRow?.fuelLevelLiters ?? null,
    })
    .where(eq(stint.id, existing.id))
    .returning();

  return c.json({ stint: updated });
});

stintRoutes.post("/races/:raceId/stints/:stintId/end", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = endStintSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  const db = getDb(c.env.DB);
  const raceId = c.req.param("raceId");
  const [existing] = await db.select().from(stint).where(eq(stint.id, c.req.param("stintId")));
  if (!existing) return c.json({ error: "not_found" }, 404);
  if (existing.status !== "active") return c.json({ error: "stint_not_active" }, 409);

  const [raceRow] = await db.select().from(race).where(eq(race.id, raceId));
  const liveRow = raceRow ? await fetchOwnCarLiveRow(c.env, raceRow) : null;

  const [updated] = await db
    .update(stint)
    .set({
      status: "completed",
      actualEndUtc: new Date().toISOString(),
      actualLaps: parsed.data.actualLaps,
      actualStintTimeSeconds: parsed.data.actualStintTimeSeconds,
      fuelAddedLiters: parsed.data.fuelAddedLiters ?? null,
      fuelLevelAtStintEndLiters: liveRow?.fuelLevelLiters ?? null,
    })
    .where(eq(stint.id, existing.id))
    .returning();

  await recomputeAndPersist(db, raceId);

  return c.json({ stint: updated });
});

stintRoutes.get("/races/:raceId/stints/:stintId/telemetry-laps", async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db
    .select()
    .from(telemetryLap)
    .where(eq(telemetryLap.stintId, c.req.param("stintId")))
    .orderBy(asc(telemetryLap.lapNumber))
    .all();
  return c.json({ laps: rows });
});
