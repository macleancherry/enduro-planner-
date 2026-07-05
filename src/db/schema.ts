import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const driver = sqliteTable("driver", {
  id: id(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  customerId: integer("customer_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const race = sqliteTable("race", {
  id: id(),
  name: text("name").notNull(),
  track: text("track").notNull(),
  startTimeUtc: text("start_time_utc").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  tankSizeLiters: real("tank_size_liters").notNull(),
  defaultFuelPerLapLiters: real("default_fuel_per_lap_liters").notNull(),
  defaultLapTimeSeconds: integer("default_lap_time_seconds").notNull(),
  pitLaneDriveTimeSeconds: integer("pit_lane_drive_time_seconds").notNull(),
  fuelFlowRateSecPerLiter: real("fuel_flow_rate_sec_per_liter").notNull(),
  carNumber: text("car_number").notNull(),
  subsessionId: text("subsession_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const raceDriver = sqliteTable(
  "race_driver",
  {
    id: id(),
    raceId: text("race_id").notNull(),
    driverId: text("driver_id").notNull(),
    order: integer("order").notNull(),
    lapTimeOverrideSeconds: integer("lap_time_override_seconds"),
    fuelPerLapOverride: real("fuel_per_lap_override"),
    lapsPerTankOverride: integer("laps_per_tank_override"),
  },
  (t) => ({
    raceDriverUnique: uniqueIndex("race_driver_race_id_driver_id").on(t.raceId, t.driverId),
  })
);

export const stint = sqliteTable(
  "stint",
  {
    id: id(),
    raceId: text("race_id").notNull(),
    stintNumber: integer("stint_number").notNull(),
    plannedDriverId: text("planned_driver_id"),
    actualDriverId: text("actual_driver_id"),
    plannedLapTimeSeconds: integer("planned_lap_time_seconds").notNull(),
    plannedLaps: integer("planned_laps").notNull(),
    plannedFuelPerLapLiters: real("planned_fuel_per_lap_liters").notNull(),
    lapTimeOverrideSeconds: integer("lap_time_override_seconds"),
    fuelPerLapOverride: real("fuel_per_lap_override"),
    lapsOverride: integer("laps_override"),
    plannedStartUtc: text("planned_start_utc").notNull(),
    plannedEndUtc: text("planned_end_utc").notNull(),
    isLikelyFinalStint: integer("is_likely_final_stint", { mode: "boolean" }).notNull().default(false),
    actualStartUtc: text("actual_start_utc"),
    actualEndUtc: text("actual_end_utc"),
    actualLaps: integer("actual_laps"),
    actualStintTimeSeconds: integer("actual_stint_time_seconds"),
    fuelAddedLiters: real("fuel_added_liters"),
    fuelLevelAtStintStartLiters: real("fuel_level_at_stint_start_liters"),
    fuelLevelAtStintEndLiters: real("fuel_level_at_stint_end_liters"),
    status: text("status", { enum: ["planned", "active", "completed"] })
      .notNull()
      .default("planned"),
  },
  (t) => ({
    stintUnique: uniqueIndex("stint_race_id_stint_number").on(t.raceId, t.stintNumber),
  })
);

export const competitor = sqliteTable("competitor", {
  id: id(),
  raceId: text("race_id").notNull(),
  name: text("name").notNull(),
  carNumber: text("car_number").notNull(),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
});

export const competitorStint = sqliteTable("competitor_stint", {
  id: id(),
  competitorId: text("competitor_id").notNull(),
  stintNumber: integer("stint_number").notNull(),
  driverName: text("driver_name"),
  startUtc: text("start_utc"),
  endUtc: text("end_utc"),
  laps: integer("laps"),
  avgLapTimeSeconds: integer("avg_lap_time_seconds"),
  notes: text("notes"),
});

export const telemetryLap = sqliteTable("telemetry_lap", {
  id: id(),
  raceId: text("race_id").notNull(),
  stintId: text("stint_id").notNull(),
  lapNumber: integer("lap_number").notNull(),
  lapTimeSeconds: real("lap_time_seconds").notNull(),
  fuelLevelLiters: real("fuel_level_liters"),
  fuelUsedLiters: real("fuel_used_liters"),
  capturedAtUtc: text("captured_at_utc")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
