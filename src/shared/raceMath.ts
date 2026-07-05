export interface RaceConstants {
  tankSizeLiters: number;
  defaultFuelPerLapLiters: number;
  defaultLapTimeSeconds: number;
  pitLaneDriveTimeSeconds: number;
  fuelFlowRateSecPerLiter: number;
}

export interface RaceDriverInput {
  id: string;
  driverId: string;
  order: number;
  lapTimeOverrideSeconds: number | null;
  fuelPerLapOverride: number | null;
  lapsPerTankOverride: number | null;
}

export interface StintOverrideInput {
  stintNumber: number;
  plannedDriverId: string | null;
  lapTimeOverrideSeconds: number | null;
  fuelPerLapOverride: number | null;
  lapsOverride: number | null;
  status: "planned" | "active" | "completed";
  plannedLapTimeSeconds: number;
  plannedLaps: number;
  plannedFuelPerLapLiters: number;
}

/** Whole laps a full tank lasts at a given fuel burn rate. Matches the spreadsheet's `=ROUNDDOWN(tank/fuelPerLap,0)`. */
export function lapsPerTank(tankSizeLiters: number, fuelPerLapLiters: number): number {
  return Math.floor(tankSizeLiters / fuelPerLapLiters);
}

/** Pit stop duration = drive time through pit lane + time spent adding fuel at the rig's flow rate. */
export function pitStopSeconds(
  pitLaneDriveTimeSeconds: number,
  fuelToAddLiters: number,
  fuelFlowRateSecPerLiter: number
): number {
  return pitLaneDriveTimeSeconds + fuelToAddLiters * fuelFlowRateSecPerLiter;
}

/** Full stint cycle: driving laps + the pit stop that follows. */
export function cycleSeconds(
  lapTimeSeconds: number,
  laps: number,
  pitLaneDriveTimeSeconds: number,
  fuelToAddLiters: number,
  fuelFlowRateSecPerLiter: number
): number {
  return lapTimeSeconds * laps + pitStopSeconds(pitLaneDriveTimeSeconds, fuelToAddLiters, fuelFlowRateSecPerLiter);
}

export interface GeneratedStint {
  stintNumber: number;
  plannedDriverId: string;
  plannedLapTimeSeconds: number;
  plannedLaps: number;
  plannedFuelPerLapLiters: number;
  plannedStartUtc: string;
  plannedEndUtc: string;
  isLikelyFinalStint: boolean;
}

/**
 * Round-robins the selected drivers from the race start time, accumulating cycle time per
 * stint. Generates enough stints to cover the race duration plus one buffer stint (sized off
 * the shortest plausible cycle, so it never under-generates). The final stint that crosses the
 * finish is not truncated to a fractional lap count — real races end on the checkered flag, not
 * on a schedule — it's just flagged as the likely final stint.
 */
export function generateSchedule(
  race: RaceConstants & { startTimeUtc: string; durationSeconds: number },
  raceDrivers: RaceDriverInput[]
): GeneratedStint[] {
  if (raceDrivers.length === 0) return [];
  const ordered = [...raceDrivers].sort((a, b) => a.order - b.order);

  const effective = ordered.map((rd) => {
    const lapTimeSeconds = rd.lapTimeOverrideSeconds ?? race.defaultLapTimeSeconds;
    const fuelPerLapLiters = rd.fuelPerLapOverride ?? race.defaultFuelPerLapLiters;
    const laps = rd.lapsPerTankOverride ?? lapsPerTank(race.tankSizeLiters, fuelPerLapLiters);
    const fuelToAddLiters = laps * fuelPerLapLiters;
    const cycle = cycleSeconds(
      lapTimeSeconds,
      laps,
      race.pitLaneDriveTimeSeconds,
      fuelToAddLiters,
      race.fuelFlowRateSecPerLiter
    );
    return { rd, lapTimeSeconds, fuelPerLapLiters, laps, cycle };
  });

  const minCycleSeconds = Math.min(...effective.map((e) => e.cycle));
  const estimatedStints = Math.ceil(race.durationSeconds / minCycleSeconds) + 1;

  const stints: GeneratedStint[] = [];
  let cursor = new Date(race.startTimeUtc).getTime();
  const finishAt = new Date(race.startTimeUtc).getTime() + race.durationSeconds * 1000;

  for (let n = 0; n < estimatedStints; n++) {
    const e = effective[n % effective.length];
    const stintStart = cursor;
    const stintEnd = stintStart + e.lapTimeSeconds * e.laps * 1000;

    stints.push({
      stintNumber: n + 1,
      plannedDriverId: e.rd.driverId,
      plannedLapTimeSeconds: e.lapTimeSeconds,
      plannedLaps: e.laps,
      plannedFuelPerLapLiters: e.fuelPerLapLiters,
      plannedStartUtc: new Date(stintStart).toISOString(),
      plannedEndUtc: new Date(stintEnd).toISOString(),
      isLikelyFinalStint: stintEnd >= finishAt,
    });

    cursor = stintStart + e.cycle * 1000;
    if (stintEnd >= finishAt) break;
  }

  return stints;
}

/**
 * Pure re-derivation pass: walks stints in order summing effective (override-or-default) cycle
 * time, so a manual override on one stint cascades to every later predicted time — mirroring the
 * spreadsheet's cumulative formulas. Never touches completed stints' actuals; only recomputes the
 * planned/predicted timestamps.
 */
export function recomputeSchedule(
  race: RaceConstants & { startTimeUtc: string },
  stints: StintOverrideInput[]
): Array<{ stintNumber: number; plannedStartUtc: string; plannedEndUtc: string }> {
  const ordered = [...stints].sort((a, b) => a.stintNumber - b.stintNumber);
  const results: Array<{ stintNumber: number; plannedStartUtc: string; plannedEndUtc: string }> = [];
  let cursor = new Date(race.startTimeUtc).getTime();

  for (const stint of ordered) {
    const lapTimeSeconds = stint.lapTimeOverrideSeconds ?? stint.plannedLapTimeSeconds;
    const fuelPerLapLiters = stint.fuelPerLapOverride ?? stint.plannedFuelPerLapLiters;
    const laps = stint.lapsOverride ?? stint.plannedLaps;
    const fuelToAddLiters = laps * fuelPerLapLiters;
    const cycle = cycleSeconds(
      lapTimeSeconds,
      laps,
      race.pitLaneDriveTimeSeconds,
      fuelToAddLiters,
      race.fuelFlowRateSecPerLiter
    );

    const stintStart = cursor;
    const stintEnd = stintStart + lapTimeSeconds * laps * 1000;
    results.push({
      stintNumber: stint.stintNumber,
      plannedStartUtc: new Date(stintStart).toISOString(),
      plannedEndUtc: new Date(stintEnd).toISOString(),
    });

    cursor = stintStart + cycle * 1000;
  }

  return results;
}

export interface FuelCalculatorResult {
  lapsRemaining: number;
  fuelToAddForFinishLiters: number;
  pitStopsRemaining: number;
}

/** Direct port of the spreadsheet's "Fuel Calculator" sheet. */
export function fuelCalculator(
  lapTimeSeconds: number,
  raceTimeRemainingSeconds: number,
  currentFuelLiters: number,
  fuelBurnPerLapLiters: number,
  maxTankLiters: number
): FuelCalculatorResult {
  const lapsRemaining = raceTimeRemainingSeconds / lapTimeSeconds;
  const fuelToAddForFinishLiters = Math.ceil(lapsRemaining) * fuelBurnPerLapLiters - currentFuelLiters;
  const pitStopsRemaining = Math.ceil(fuelToAddForFinishLiters / maxTankLiters);
  return { lapsRemaining, fuelToAddForFinishLiters, pitStopsRemaining };
}

export type DeltaDirection = "better" | "worse" | "onTarget";

export interface Delta {
  value: number;
  direction: DeltaDirection;
}

function directionOf(value: number, epsilon: number): DeltaDirection {
  if (Math.abs(value) < epsilon) return "onTarget";
  return value > 0 ? "worse" : "better";
}

/** Positive = slower than planned (worse). Epsilon in seconds avoids flagging noise as a miss. */
export function paceDelta(actualAvgLapTimeSeconds: number, plannedLapTimeSeconds: number, epsilon = 0.1): Delta {
  const value = actualAvgLapTimeSeconds - plannedLapTimeSeconds;
  return { value, direction: directionOf(value, epsilon) };
}

/** Positive = burning more fuel per lap than planned (worse). */
export function fuelDelta(actualFuelPerLapLiters: number, plannedFuelPerLapLiters: number, epsilon = 0.05): Delta {
  const value = actualFuelPerLapLiters - plannedFuelPerLapLiters;
  return { value, direction: directionOf(value, epsilon) };
}
