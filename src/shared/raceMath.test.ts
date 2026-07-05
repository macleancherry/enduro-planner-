import { describe, it, expect } from "vitest";
import {
  lapsPerTank,
  pitStopSeconds,
  cycleSeconds,
  generateSchedule,
  fuelCalculator,
  paceDelta,
  fuelDelta,
} from "./raceMath";

// Reference values from the actual Spa24_2026_Ignium_Motorsport.xlsx spreadsheet.
describe("raceMath against the spreadsheet's real numbers", () => {
  it("lapsPerTank matches the sheet: 100L tank, 4.0L/lap -> 25 laps", () => {
    expect(lapsPerTank(100, 4.0)).toBe(25);
  });

  it("pitStopSeconds matches the sheet: 20s pit lane + 100L @ 0.693 s/L -> 89s (0:01:29)", () => {
    expect(Math.round(pitStopSeconds(20, 100, 0.693))).toBe(89);
  });

  it("cycleSeconds matches the sheet's default total stint time of 0:58:34", () => {
    // lap time 2:17 (137s) * 25 laps + 89s pit stop = 3425 + 89 = 3514s = 58:34
    const seconds = cycleSeconds(137, 25, 20, 100, 0.693);
    expect(Math.round(seconds)).toBe(3514);
  });

  it("generateSchedule round-robins drivers and covers the race duration", () => {
    const race = {
      startTimeUtc: "2026-06-20T12:45:00.000Z",
      durationSeconds: 24 * 3600,
      tankSizeLiters: 100,
      defaultFuelPerLapLiters: 4.0,
      defaultLapTimeSeconds: 137,
      pitLaneDriveTimeSeconds: 20,
      fuelFlowRateSecPerLiter: 0.693,
    };
    const drivers = ["a", "b", "c", "d"].map((id, i) => ({
      id,
      driverId: id,
      order: i,
      lapTimeOverrideSeconds: null,
      fuelPerLapOverride: null,
      lapsPerTankOverride: null,
    }));

    const schedule = generateSchedule(race, drivers);

    expect(schedule[0].plannedDriverId).toBe("a");
    expect(schedule[1].plannedDriverId).toBe("b");
    expect(schedule[4].plannedDriverId).toBe("a");
    expect(schedule.some((s) => s.isLikelyFinalStint)).toBe(true);

    const last = schedule[schedule.length - 1];
    expect(new Date(last.plannedEndUtc).getTime()).toBeGreaterThanOrEqual(
      new Date(race.startTimeUtc).getTime() + race.durationSeconds * 1000
    );
  });

  it("fuelCalculator matches the sheet's Fuel Calculator sheet", () => {
    // Sheet inputs: lap time 2:17, race time remaining 24:00:00, current fuel 56L, burn 4L/lap, max tank 100L
    const result = fuelCalculator(137, 24 * 3600, 56, 4, 100);
    expect(Math.round(result.lapsRemaining)).toBe(631);
    expect(result.fuelToAddForFinishLiters).toBe(Math.ceil(result.lapsRemaining) * 4 - 56);
    expect(result.pitStopsRemaining).toBe(Math.ceil(result.fuelToAddForFinishLiters / 100));
  });

  it("paceDelta signs positive for slower-than-planned laps", () => {
    expect(paceDelta(139, 137).direction).toBe("worse");
    expect(paceDelta(135, 137).direction).toBe("better");
    expect(paceDelta(137.05, 137).direction).toBe("onTarget");
  });

  it("fuelDelta signs positive for burning more than planned", () => {
    expect(fuelDelta(4.5, 4.0).direction).toBe("worse");
    expect(fuelDelta(3.6, 4.0).direction).toBe("better");
  });
});
