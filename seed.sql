-- Idempotent seed: imports the roster from the team's "All Drivers" spreadsheet sheet and
-- creates the first race (Spa 24h 2026, Ignium Motorsport) with its real constants and the
-- 4 drivers marked available for it. Safe to re-run — INSERT OR IGNORE on fixed ids.

INSERT OR IGNORE INTO driver (id, name, timezone, customer_id, created_at) VALUES
  ('driver-chris-young',     'Chris Young',      'Europe/London',       NULL, datetime('now')),
  ('driver-edd-knight',      'Edd Knight',       'Europe/London',       NULL, datetime('now')),
  ('driver-jaco-boshoff',    'Jaco Boshoff',     'Europe/London',       NULL, datetime('now')),
  ('driver-steve-norman',    'Steve Norman',     'UTC',                 NULL, datetime('now')),
  ('driver-john-buwalda',    'John Buwalda',     'UTC',                 NULL, datetime('now')),
  ('driver-brad-beningfield','Brad Beningfield', 'Europe/London',       NULL, datetime('now')),
  ('driver-ryan-hirons',     'Ryan Hirons',      'Europe/London',       NULL, datetime('now')),
  ('driver-finn-robinson',   'Finn Robinson',    'UTC',                 NULL, datetime('now')),
  ('driver-joel-farley',     'Joel Farley',      'Australia/Adelaide',  NULL, datetime('now')),
  ('driver-daniel-barrett',  'Daniel Barrett',   'America/New_York',    NULL, datetime('now')),
  ('driver-matt-beattie',    'Matt Beattie',     'Australia/Brisbane',  NULL, datetime('now')),
  ('driver-brendan-mcvicar', 'Brendan McVicar',  'Australia/Sydney',    NULL, datetime('now')),
  ('driver-mac-cherry',      'Mac Cherry',       'Australia/Perth',     NULL, datetime('now')),
  ('driver-oli-roder',       'Oli Roder',        'Europe/Dublin',       NULL, datetime('now')),
  ('driver-bf-young',        'BF Young',         'Australia/Melbourne', NULL, datetime('now')),
  ('driver-jonas-degn',      'Jonas Degn',       'Asia/Tokyo',          NULL, datetime('now'));

-- Constants match the spreadsheet exactly: 100L tank, 4.0L/lap (25 laps/tank), 2:17 lap time,
-- 20s pit lane drive time, 0.693 s/L fuel flow rate. Start time and car number are placeholders
-- — update them on the Plan/race-edit page once known.
INSERT OR IGNORE INTO race (
  id, name, track, start_time_utc, duration_seconds, tank_size_liters,
  default_fuel_per_lap_liters, default_lap_time_seconds, pit_lane_drive_time_seconds,
  fuel_flow_rate_sec_per_liter, car_number, subsession_id, created_at
) VALUES (
  'race-spa24-2026-ignium', 'Spa 24 2026 — Ignium Motorsport', 'Spa-Francorchamps',
  '2026-08-01T12:45:00.000Z', 86400, 100.0,
  4.0, 137, 20,
  0.693, '1', NULL, datetime('now')
);

INSERT OR IGNORE INTO race_driver (id, race_id, driver_id, "order", lap_time_override_seconds, fuel_per_lap_override, laps_per_tank_override) VALUES
  ('race-driver-spa24-mac-cherry',   'race-spa24-2026-ignium', 'driver-mac-cherry',     0, NULL, NULL, NULL),
  ('race-driver-spa24-chris-young',  'race-spa24-2026-ignium', 'driver-chris-young',    1, NULL, NULL, NULL),
  ('race-driver-spa24-edd-knight',   'race-spa24-2026-ignium', 'driver-edd-knight',     2, NULL, NULL, NULL),
  ('race-driver-spa24-daniel-barrett','race-spa24-2026-ignium','driver-daniel-barrett', 3, NULL, NULL, NULL);
