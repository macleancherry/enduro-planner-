# Enduro Planner

Race planning and live "race control" tracking for Ignium Motorsport's iRacing endurance races —
driver roster, stint scheduling with fuel/pace targets, and a live dashboard that compares actuals
against plan and pulls in telemetry from the team's existing live-timing pipeline.

Ported from (and validated against) the team's `Spa24_2026_Ignium_Motorsport.xlsx` planning
spreadsheet — see `src/shared/raceMath.ts` and its test file for the formulas.

## Stack

Single Cloudflare Worker serving a Vite/React SPA as static assets, with a Hono API in the same
Worker, backed by Cloudflare D1 (SQLite) via Drizzle ORM. No separate frontend/backend deploy —
one `wrangler deploy`.

## First-time setup

1. `npm install`
2. Create the D1 database and record its ID:
   ```
   npx wrangler d1 create enduro-planner-db
   ```
   Copy the `database_id` it prints into `wrangler.jsonc`'s `d1_databases[0].database_id`
   (currently a placeholder).
3. Copy `.dev.vars.example` to `.dev.vars` and fill in a real passcode + secret for local dev.
4. Apply migrations and seed data locally:
   ```
   npm run db:migrate:local
   npm run db:seed:local
   ```
5. `npm run dev` — serves the app with a real local D1 database, no Docker needed.

The seed creates the full driver roster from the spreadsheet and the first race (Spa 24h 2026)
pre-populated with its real constants and the 4 available drivers, so there's something to look
at immediately. Two fields in the seed are placeholders you should update on the Plan page (or via
`PATCH /api/races/:id`) once known: the race's actual start date/time and your car number.

## Deploying

1. Apply migrations to the real database: `npm run db:migrate:remote`
2. Seed it (optional, same idempotent script): `npm run db:seed:remote`
3. Set secrets: `wrangler secret put PASSCODE` and `wrangler secret put PASSCODE_HMAC_SECRET`
4. Update `wrangler.jsonc`'s `vars.LIVE_WORKER_URL` to your actual deployed
   `ignium-live-worker` URL.
5. `npm run deploy` (or push to the branch your Cloudflare project auto-deploys from).

## Live telemetry

The live-tracking page (`/races/:id/live`) reads from the team's existing `ignium-live-worker`
(a separate Cloudflare Worker + D1 service that the `ignium-live-collector-dotnet` app already
feeds from iRacing). It's entirely optional — set a race's `subsessionId` (on the Plan page) once
the iRacing session is known, and the dashboard starts showing live position, gaps, and pace.
Leave it blank and everything still works with fully manual entry.

Two small additive extensions to those other repos (branches `claude/live-timing-session-meta` in
`ignium-live-worker` and `claude/fuel-gauge-telemetry` in `ignium-live-collector-dotnet`, committed
but not pushed) add session flags and own-car fuel/RPM/speed/gear/TC — see each repo's commit for
details. Until those are deployed, the flag banner and gauge cluster simply don't render; laps,
positions, gaps, and driver-swap detection already work today without them.

## Testing

- `npm run test` — unit tests for the race-planning math (`src/shared/raceMath.ts`), checked
  against the original spreadsheet's actual numbers.
- `npm run typecheck`
- `npm run build` — also a good pre-deploy sanity check.
