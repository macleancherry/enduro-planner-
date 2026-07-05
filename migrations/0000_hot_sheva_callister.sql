CREATE TABLE `competitor` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`name` text NOT NULL,
	`car_number` text NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `competitor_stint` (
	`id` text PRIMARY KEY NOT NULL,
	`competitor_id` text NOT NULL,
	`stint_number` integer NOT NULL,
	`driver_name` text,
	`start_utc` text,
	`end_utc` text,
	`laps` integer,
	`avg_lap_time_seconds` integer,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `driver` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`timezone` text NOT NULL,
	`customer_id` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `race` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`track` text NOT NULL,
	`start_time_utc` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`tank_size_liters` real NOT NULL,
	`default_fuel_per_lap_liters` real NOT NULL,
	`default_lap_time_seconds` integer NOT NULL,
	`pit_lane_drive_time_seconds` integer NOT NULL,
	`fuel_flow_rate_sec_per_liter` real NOT NULL,
	`car_number` text NOT NULL,
	`subsession_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `race_driver` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`driver_id` text NOT NULL,
	`order` integer NOT NULL,
	`lap_time_override_seconds` integer,
	`fuel_per_lap_override` real,
	`laps_per_tank_override` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `race_driver_race_id_driver_id` ON `race_driver` (`race_id`,`driver_id`);--> statement-breakpoint
CREATE TABLE `stint` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`stint_number` integer NOT NULL,
	`planned_driver_id` text,
	`actual_driver_id` text,
	`planned_lap_time_seconds` integer NOT NULL,
	`planned_laps` integer NOT NULL,
	`planned_fuel_per_lap_liters` real NOT NULL,
	`lap_time_override_seconds` integer,
	`fuel_per_lap_override` real,
	`laps_override` integer,
	`planned_start_utc` text NOT NULL,
	`planned_end_utc` text NOT NULL,
	`is_likely_final_stint` integer DEFAULT false NOT NULL,
	`actual_start_utc` text,
	`actual_end_utc` text,
	`actual_laps` integer,
	`actual_stint_time_seconds` integer,
	`fuel_added_liters` real,
	`fuel_level_at_stint_start_liters` real,
	`fuel_level_at_stint_end_liters` real,
	`status` text DEFAULT 'planned' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stint_race_id_stint_number` ON `stint` (`race_id`,`stint_number`);--> statement-breakpoint
CREATE TABLE `telemetry_lap` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`stint_id` text NOT NULL,
	`lap_number` integer NOT NULL,
	`lap_time_seconds` real NOT NULL,
	`fuel_level_liters` real,
	`fuel_used_liters` real,
	`captured_at_utc` text NOT NULL
);
