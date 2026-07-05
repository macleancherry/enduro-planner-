import { z } from "zod";

export const driverInputSchema = z.object({
  name: z.string().min(1),
  timezone: z.string().min(1),
  customerId: z.number().int().positive().nullable().optional(),
});

export const raceInputSchema = z.object({
  name: z.string().min(1),
  track: z.string().min(1),
  startTimeUtc: z.string().min(1),
  durationSeconds: z.number().int().positive(),
  tankSizeLiters: z.number().positive(),
  defaultFuelPerLapLiters: z.number().positive(),
  defaultLapTimeSeconds: z.number().int().positive(),
  pitLaneDriveTimeSeconds: z.number().int().nonnegative(),
  fuelFlowRateSecPerLiter: z.number().positive(),
  carNumber: z.string().min(1),
  subsessionId: z.string().nullable().optional(),
  driverIds: z.array(z.string().min(1)).min(1),
});

export const stintUpdateSchema = z.object({
  plannedDriverId: z.string().nullable().optional(),
  lapTimeOverrideSeconds: z.number().int().positive().nullable().optional(),
  fuelPerLapOverride: z.number().positive().nullable().optional(),
  lapsOverride: z.number().int().positive().nullable().optional(),
});

export const startStintSchema = z.object({
  actualDriverId: z.string().min(1).optional(),
});

export const endStintSchema = z.object({
  actualLaps: z.number().int().nonnegative(),
  actualStintTimeSeconds: z.number().int().positive(),
  fuelAddedLiters: z.number().nonnegative().nullable().optional(),
});

export const competitorInputSchema = z.object({
  name: z.string().min(1),
  carNumber: z.string().min(1),
});

export const competitorUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  carNumber: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
});

export const competitorStintInputSchema = z.object({
  stintNumber: z.number().int().positive(),
  driverName: z.string().nullable().optional(),
  startUtc: z.string().nullable().optional(),
  endUtc: z.string().nullable().optional(),
  laps: z.number().int().nonnegative().nullable().optional(),
  avgLapTimeSeconds: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const loginSchema = z.object({
  passcode: z.string().min(1),
});
