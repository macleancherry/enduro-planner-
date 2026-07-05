import { eq, desc } from "drizzle-orm";
import type { Env } from "./env";
import { getDb } from "./db";
import { race, competitor, stint, telemetryLap, driver } from "../db/schema";
import { decodeSessionFlags } from "../shared/flags";

export interface ExternalLiveRow {
  sessionId: string;
  subsessionId: string;
  customerId: number;
  driverName: string;
  teamName?: string | null;
  carNumber: string;
  position: number;
  classPosition: number;
  classId?: number | null;
  classShortName?: string | null;
  iRating?: number | null;
  lap: number;
  lastLap: number | null;
  bestLap: number | null;
  interval: number | null;
  gap: number | null;
  inPits?: number | boolean | null;
  outLap?: number | boolean | null;
  lastPitLap?: number | null;
  updatedAt: string;
  receivedAt: string;
}

// The worker doesn't yet store/return this — see the plan's "Cross-repo telemetry extension"
// section. Wired up here so the rest of the app only needs to change once that ships.
export interface ExternalSessionMeta {
  sessionFlags?: number | null;
  fuelLevel?: number | null;
  rpm?: number | null;
  speed?: number | null;
  gear?: number | null;
  tractionControl?: number | null;
}

interface RaceForLive {
  carNumber: string;
  subsessionId: string | null;
}

async function fetchRawRows(env: Env, subsessionId: string): Promise<ExternalLiveRow[]> {
  const url = `${env.LIVE_WORKER_URL}/api/live?subsessionId=${encodeURIComponent(subsessionId)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const body = (await res.json()) as { ok: boolean; rows?: ExternalLiveRow[] };
  return body.rows ?? [];
}

/**
 * The worker upserts on (subsession_id, customer_id) and never deletes rows, so after a driver
 * swap a car number has one stale row per former driver, frozen at their last-seen state, plus
 * the current driver's live row. Keep only the freshest row per car number.
 */
export function dedupeByCarNumber(rows: ExternalLiveRow[]): ExternalLiveRow[] {
  const byCarNumber = new Map<string, ExternalLiveRow>();
  for (const row of rows) {
    const existing = byCarNumber.get(row.carNumber);
    if (!existing || row.updatedAt > existing.updatedAt) {
      byCarNumber.set(row.carNumber, row);
    }
  }
  return [...byCarNumber.values()].sort((a, b) => a.position - b.position);
}

export async function fetchOwnCarLiveRow(
  env: Env,
  raceRecord: RaceForLive
): Promise<(ExternalLiveRow & { fuelLevelLiters: number | null }) | null> {
  if (!raceRecord.subsessionId) return null;
  const rows = dedupeByCarNumber(await fetchRawRows(env, raceRecord.subsessionId));
  const own = rows.find((r) => r.carNumber === raceRecord.carNumber);
  if (!own) return null;
  // fuelLevel isn't available until the sessionMeta extension ships (see ExternalSessionMeta).
  return { ...own, fuelLevelLiters: null };
}

function isInPits(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1;
}

export interface LeaderboardRow {
  position: number;
  classPosition: number;
  classShortName: string | null;
  carNumber: string;
  driverName: string;
  teamName: string | null;
  customerId: number;
  gapSeconds: number | null;
  intervalSeconds: number | null;
  lastLapSeconds: number | null;
  bestLapSeconds: number | null;
  inPits: boolean;
  lapsSincePit: number | null;
  isOurCar: boolean;
  isPinnedCompetitor: boolean;
}

export async function buildLiveSnapshot(env: Env, raceId: string) {
  const db = getDb(env.DB);
  const [raceRecord] = await db.select().from(race).where(eq(race.id, raceId));

  if (!raceRecord || !raceRecord.subsessionId) {
    return { live: null as null };
  }

  const rawRows = await fetchRawRows(env, raceRecord.subsessionId);
  const deduped = dedupeByCarNumber(rawRows);

  const competitors = await db.select().from(competitor).where(eq(competitor.raceId, raceId)).all();
  const pinnedCarNumbers = new Set(competitors.filter((c) => c.isPinned).map((c) => c.carNumber));

  const leaderboard: LeaderboardRow[] = deduped.map((row) => ({
    position: row.position,
    classPosition: row.classPosition,
    classShortName: row.classShortName ?? null,
    carNumber: row.carNumber,
    driverName: row.driverName,
    teamName: row.teamName ?? null,
    customerId: row.customerId,
    gapSeconds: row.gap,
    intervalSeconds: row.interval,
    lastLapSeconds: row.lastLap,
    bestLapSeconds: row.bestLap,
    inPits: isInPits(row.inPits),
    lapsSincePit: row.lastPitLap != null ? row.lap - row.lastPitLap : null,
    isOurCar: row.carNumber === raceRecord.carNumber,
    isPinnedCompetitor: pinnedCarNumbers.has(row.carNumber),
  }));

  const ownRow = deduped.find((r) => r.carNumber === raceRecord.carNumber) ?? null;
  const stints = await db.select().from(stint).where(eq(stint.raceId, raceId)).all();
  const active = stints.find((s) => s.status === "active") ?? null;

  // Driver-swap detection: compare telemetry's current driver against our active stint's driver.
  // The client requires this to repeat on 2 consecutive polls before showing a confirm banner.
  let driverSwapCandidate: { telemetryCustomerId: number; mappedDriverId: string; mappedDriverName: string } | null =
    null;
  if (ownRow && active) {
    const [mappedDriver] = await db.select().from(driver).where(eq(driver.customerId, ownRow.customerId));
    if (mappedDriver && mappedDriver.id !== active.actualDriverId) {
      driverSwapCandidate = {
        telemetryCustomerId: ownRow.customerId,
        mappedDriverId: mappedDriver.id,
        mappedDriverName: mappedDriver.name,
      };
    }
  }

  // Lap-boundary detection for our own car: append a telemetry_lap row when the lap counter has
  // advanced past what we've already logged for the active stint. fuelLevelLiters stays null
  // until the sessionMeta extension ships (see ExternalSessionMeta).
  if (ownRow && active) {
    const [lastLogged] = await db
      .select()
      .from(telemetryLap)
      .where(eq(telemetryLap.stintId, active.id))
      .orderBy(desc(telemetryLap.lapNumber))
      .limit(1);
    const maxLogged = lastLogged?.lapNumber ?? 0;
    const completedLap = ownRow.lap - 1;
    if (completedLap > maxLogged && ownRow.lastLap != null) {
      await db.insert(telemetryLap).values({
        raceId,
        stintId: active.id,
        lapNumber: completedLap,
        lapTimeSeconds: ownRow.lastLap,
        fuelLevelLiters: null,
        fuelUsedLiters: null,
      });
    }
  }

  const recentLaps = active
    ? await db
        .select()
        .from(telemetryLap)
        .where(eq(telemetryLap.stintId, active.id))
        .orderBy(desc(telemetryLap.lapNumber))
        .limit(5)
    : [];

  return {
    live: {
      leaderboard,
      ownCar: ownRow
        ? {
            carNumber: ownRow.carNumber,
            driverName: ownRow.driverName,
            lap: ownRow.lap,
            lastLapSeconds: ownRow.lastLap,
            bestLapSeconds: ownRow.bestLap,
            inPits: isInPits(ownRow.inPits),
          }
        : null,
      recentLaps,
      driverSwapCandidate,
      flag: null as ReturnType<typeof decodeSessionFlags> | null, // populated once sessionMeta ships
    },
  };
}
