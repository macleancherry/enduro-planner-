import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api, type Race, type Stint, type Driver, type LiveSnapshot } from "../api";
import { formatMMSS, parseMMSS } from "../../shared/format";
import { paceDelta, fuelDelta } from "../../shared/raceMath";
import { FlagBanner } from "../components/FlagBanner";
import { DeltaBadge } from "../components/DeltaBadge";
import { FuelCalculatorWidget } from "../components/FuelCalculatorWidget";

export function RaceControlPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const [race, setRace] = useState<Race | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stints, setStints] = useState<Stint[]>([]);
  const [live, setLive] = useState<LiveSnapshot["live"]>(null);
  const [endForm, setEndForm] = useState({ actualLaps: "", actualStintTime: "", fuelAdded: "" });
  const prevSwapCandidateRef = useRef<string | null>(null);
  const [confirmedSwapCandidate, setConfirmedSwapCandidate] = useState<string | null>(null);

  const refreshCore = useCallback(async () => {
    if (!raceId) return;
    const [raceRes, driversRes, stintsRes] = await Promise.all([
      api.getRace(raceId),
      api.listDrivers(),
      api.listStints(raceId),
    ]);
    setRace(raceRes.race);
    setDrivers(driversRes.drivers);
    setStints(stintsRes.stints);
  }, [raceId]);

  const pollLive = useCallback(async () => {
    if (!raceId) return;
    const res = await api.getLive(raceId);
    setLive(res.live);

    const candidateKey = res.live?.driverSwapCandidate
      ? `${res.live.driverSwapCandidate.telemetryCustomerId}:${res.live.driverSwapCandidate.mappedDriverId}`
      : null;
    if (candidateKey && candidateKey === prevSwapCandidateRef.current) {
      setConfirmedSwapCandidate(candidateKey);
    } else if (!candidateKey) {
      setConfirmedSwapCandidate(null);
    }
    prevSwapCandidateRef.current = candidateKey;
  }, [raceId]);

  useEffect(() => {
    refreshCore();
  }, [refreshCore]);

  useEffect(() => {
    pollLive();
    let interval: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (interval) return;
      interval = setInterval(pollLive, 2000);
    }
    function stop() {
      if (interval) clearInterval(interval);
      interval = null;
    }
    function handleVisibility() {
      if (document.hidden) stop();
      else start();
    }

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pollLive]);

  if (!race) return <p className="text-ignium-muted">Loading...</p>;

  const driverById = new Map(drivers.map((d) => [d.id, d]));
  const activeStint = stints.find((s) => s.status === "active") ?? null;
  const nextPlanned = stints
    .filter((s) => s.status === "planned")
    .sort((a, b) => a.stintNumber - b.stintNumber)[0];
  const upcoming = stints.filter((s) => s.status === "planned").slice(0, 5);
  const completed = stints.filter((s) => s.status === "completed").sort((a, b) => b.stintNumber - a.stintNumber);

  async function handleStart(stint: Stint) {
    if (!raceId) return;
    await api.startStint(raceId, stint.id);
    refreshCore();
  }

  async function handleEnd(stint: Stint) {
    if (!raceId) return;
    const actualLaps = Number(endForm.actualLaps);
    const actualStintTimeSeconds = parseMMSS(endForm.actualStintTime);
    if (Number.isNaN(actualLaps) || Number.isNaN(actualStintTimeSeconds)) return;
    await api.endStint(raceId, stint.id, {
      actualLaps,
      actualStintTimeSeconds,
      fuelAddedLiters: endForm.fuelAdded ? Number(endForm.fuelAdded) : null,
    });
    setEndForm({ actualLaps: "", actualStintTime: "", fuelAdded: "" });
    refreshCore();
  }

  async function handleConfirmSwap() {
    if (!raceId || !live?.driverSwapCandidate || !activeStint) return;
    // Close the current stint using the last-seen telemetry lap count, then start the next one
    // under the new driver — still editable afterwards, this is just a fast-path suggestion.
    const suggestedLaps = live.ownCar?.lap ?? activeStint.actualLaps ?? 0;
    await api.endStint(raceId, activeStint.id, {
      actualLaps: suggestedLaps,
      actualStintTimeSeconds: activeStint.actualStartUtc
        ? Math.round((Date.now() - new Date(activeStint.actualStartUtc).getTime()) / 1000)
        : 0,
      fuelAddedLiters: null,
    });
    if (nextPlanned) {
      await api.startStint(raceId, nextPlanned.id, live.driverSwapCandidate.mappedDriverId);
    }
    setConfirmedSwapCandidate(null);
    refreshCore();
  }

  const activeDriver = activeStint?.actualDriverId ? driverById.get(activeStint.actualDriverId) : undefined;
  const pace =
    activeStint && live?.ownCar?.lastLapSeconds != null
      ? paceDelta(live.ownCar.lastLapSeconds, activeStint.lapTimeOverrideSeconds ?? activeStint.plannedLapTimeSeconds)
      : null;

  const inputClass =
    "bg-ignium-panel2 border border-ignium-border text-ignium-text placeholder:text-ignium-muted rounded px-2 py-1 text-sm focus:outline-none focus:border-ignium-accent";
  const primaryButton =
    "bg-ignium-accent text-ignium-bg rounded px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:brightness-110 transition";
  const card = "bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4";

  return (
    <div>
      <FlagBanner flag={live?.flag ?? null} />

      {confirmedSwapCandidate && live?.driverSwapCandidate && activeStint && (
        <div className="bg-ignium-warning/15 border border-ignium-warning/40 text-ignium-warning rounded-lg p-3 mb-4 flex items-center justify-between">
          <span>
            Driver swap detected: {activeDriver?.name ?? "current driver"} →{" "}
            {live.driverSwapCandidate.mappedDriverName}. Confirm to close this stint and start the next?
          </span>
          <button onClick={handleConfirmSwap} className="bg-ignium-warning text-ignium-bg rounded px-3 py-1 text-sm font-semibold">
            Confirm
          </button>
        </div>
      )}

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "1fr",
        }}
      >
        <div className="lg:grid lg:gap-4" style={{ gridTemplateColumns: "280px 1fr 340px" }}>
          <div className="grid gap-4 lg:contents">
            <div className={card}>
              <h2 className="font-semibold text-ignium-text mb-2">Own car telemetry</h2>
              {live?.ownCar ? (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <Gauge label="Lap" value={String(live.ownCar.lap)} />
                  <Gauge label="Last lap" value={live.ownCar.lastLapSeconds != null ? formatMMSS(live.ownCar.lastLapSeconds) : "—"} />
                  <Gauge label="Best lap" value={live.ownCar.bestLapSeconds != null ? formatMMSS(live.ownCar.bestLapSeconds) : "—"} />
                  <Gauge label="In pits" value={live.ownCar.inPits ? "Yes" : "No"} />
                </div>
              ) : (
                <p className="text-sm text-ignium-muted">
                  No live telemetry yet — set the subsession ID on the Plan page once the session is live. RPM/speed/gear/TC gauges need the collector/worker fuel &amp; gauge extension.
                </p>
              )}
              {pace && (
                <div className="mt-3">
                  <DeltaBadge delta={pace} unit="s/lap" />
                </div>
              )}
            </div>

            <div className={card}>
              <h2 className="font-semibold text-ignium-text mb-2">Recent laps</h2>
              {live?.recentLaps.length ? (
                <table className="w-full text-sm">
                  <tbody>
                    {live.recentLaps.map((l) => (
                      <tr key={l.id} className="border-t border-ignium-border">
                        <td className="py-1 text-ignium-text">Lap {l.lapNumber}</td>
                        <td className="py-1 text-ignium-text">{formatMMSS(l.lapTimeSeconds)}</td>
                        <td className="py-1 text-ignium-muted">
                          {l.fuelUsedLiters != null ? `${l.fuelUsedLiters.toFixed(2)} L` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-ignium-muted">No laps logged yet this stint.</p>
              )}
            </div>

            <div className={card}>
              <h2 className="font-semibold text-ignium-text mb-2">Current stint</h2>
              {activeStint ? (
                <div>
                  <p className="text-sm text-ignium-mutedLight mb-2">
                    Stint {activeStint.stintNumber} — {activeDriver?.name ?? "unassigned"} — target{" "}
                    {formatMMSS(activeStint.lapTimeOverrideSeconds ?? activeStint.plannedLapTimeSeconds)}/lap
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      value={endForm.actualLaps}
                      onChange={(e) => setEndForm((f) => ({ ...f, actualLaps: e.target.value }))}
                      placeholder="Laps"
                      className={inputClass}
                    />
                    <input
                      value={endForm.actualStintTime}
                      onChange={(e) => setEndForm((f) => ({ ...f, actualStintTime: e.target.value }))}
                      placeholder="Stint time (mm:ss)"
                      className={inputClass}
                    />
                    <input
                      value={endForm.fuelAdded}
                      onChange={(e) => setEndForm((f) => ({ ...f, fuelAdded: e.target.value }))}
                      placeholder="Fuel added (L)"
                      className={inputClass}
                    />
                  </div>
                  {live?.ownCar && (
                    <button
                      onClick={() => setEndForm((f) => ({ ...f, actualLaps: String(live.ownCar!.lap) }))}
                      className="text-xs text-ignium-accent hover:underline mb-2"
                    >
                      ↩ use telemetry: {live.ownCar.lap} laps
                    </button>
                  )}
                  <button onClick={() => handleEnd(activeStint)} className={primaryButton}>
                    End stint
                  </button>
                </div>
              ) : nextPlanned ? (
                <div>
                  <p className="text-sm text-ignium-mutedLight mb-2">
                    Next: Stint {nextPlanned.stintNumber} — {driverById.get(nextPlanned.plannedDriverId ?? "")?.name}
                  </p>
                  <button onClick={() => handleStart(nextPlanned)} className={primaryButton}>
                    Start stint
                  </button>
                </div>
              ) : (
                <p className="text-sm text-ignium-muted">No stints planned — generate a schedule first.</p>
              )}
            </div>

            <FuelCalculatorWidget
              defaultLapTimeSeconds={race.defaultLapTimeSeconds}
              defaultFuelPerLapLiters={race.defaultFuelPerLapLiters}
              tankSizeLiters={race.tankSizeLiters}
            />
          </div>

          <div className="mt-4 lg:mt-0">
            <div className={`${card} mb-4`}>
              <h2 className="font-semibold text-ignium-text mb-2">Leaderboard</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ignium-muted">
                      <th className="py-1 pr-2">Pos</th>
                      <th className="py-1 pr-2">Class</th>
                      <th className="py-1 pr-2">Car</th>
                      <th className="py-1 pr-2">Driver</th>
                      <th className="py-1 pr-2">Gap</th>
                      <th className="py-1 pr-2">Int</th>
                      <th className="py-1 pr-2">Last lap</th>
                      <th className="py-1 pr-2">Laps/pit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live?.leaderboard.map((row) => (
                      <tr
                        key={row.carNumber}
                        className={`border-t border-ignium-border text-ignium-text ${
                          row.isOurCar ? "bg-ignium-accent/10 font-medium" : ""
                        } ${row.isPinnedCompetitor ? "bg-ignium-warning/10" : ""}`}
                      >
                        <td className="py-1 pr-2">{row.position}</td>
                        <td className="py-1 pr-2">{row.classShortName ?? "—"}</td>
                        <td className="py-1 pr-2">#{row.carNumber}</td>
                        <td className="py-1 pr-2">{row.driverName}</td>
                        <td className="py-1 pr-2">{row.gapSeconds != null ? formatMMSS(row.gapSeconds) : "—"}</td>
                        <td className="py-1 pr-2">{row.intervalSeconds != null ? formatMMSS(row.intervalSeconds) : "—"}</td>
                        <td className="py-1 pr-2">{row.lastLapSeconds != null ? formatMMSS(row.lastLapSeconds) : "—"}</td>
                        <td className="py-1 pr-2">{row.inPits ? "In pits" : row.lapsSincePit ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!live && <p className="text-sm text-ignium-muted mt-2">No live data — set a subsession ID on the Plan page.</p>}
              </div>
            </div>

            <div className={card}>
              <h2 className="font-semibold text-ignium-text mb-2">Completed stints</h2>
              <div className="grid gap-2">
                {completed.map((s) => {
                  const laps = s.actualLaps ?? 0;
                  const target = s.lapTimeOverrideSeconds ?? s.plannedLapTimeSeconds;
                  const actualAvg = s.actualStintTimeSeconds && laps ? s.actualStintTimeSeconds / laps : null;
                  const p = actualAvg != null ? paceDelta(actualAvg, target) : null;
                  const targetFuel = s.fuelPerLapOverride ?? s.plannedFuelPerLapLiters;
                  const actualFuelPerLap = s.fuelAddedLiters && laps ? s.fuelAddedLiters / laps : null;
                  const f = actualFuelPerLap != null ? fuelDelta(actualFuelPerLap, targetFuel) : null;
                  return (
                    <div key={s.id} className="border-t border-ignium-border pt-2 flex items-center justify-between text-sm">
                      <span className="text-ignium-text">
                        Stint {s.stintNumber} — {driverById.get(s.actualDriverId ?? "")?.name} — {laps} laps
                      </span>
                      <span className="flex gap-2">
                        {p && <DeltaBadge delta={p} unit="s/lap" compact />}
                        {f && <DeltaBadge delta={f} unit="L/lap" compact />}
                      </span>
                    </div>
                  );
                })}
                {completed.length === 0 && <p className="text-sm text-ignium-muted">No completed stints yet.</p>}
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-0">
            <div className={`${card} mb-4`}>
              <h2 className="font-semibold text-ignium-text mb-2">Pinned competitors</h2>
              <div className="grid gap-2">
                {live?.leaderboard.filter((r) => r.isPinnedCompetitor).map((r) => {
                  const ourRow = live.leaderboard.find((x) => x.isOurCar);
                  const gapToUs =
                    ourRow && r.gapSeconds != null && ourRow.gapSeconds != null ? r.gapSeconds - ourRow.gapSeconds : null;
                  return (
                    <div key={r.carNumber} className="border border-ignium-warning/30 bg-ignium-warning/10 rounded p-2 text-sm">
                      <div className="font-medium text-ignium-text">
                        #{r.carNumber} — {r.driverName}
                      </div>
                      <div className="text-ignium-mutedLight">
                        Gap to us: {gapToUs != null ? formatMMSS(gapToUs) : "—"} — laps since pit:{" "}
                        {r.lapsSincePit ?? "—"}
                        {ourRow ? ` (us: ${ourRow.lapsSincePit ?? "—"})` : ""}
                      </div>
                    </div>
                  );
                })}
                {!live?.leaderboard.some((r) => r.isPinnedCompetitor) && (
                  <p className="text-sm text-ignium-muted">Pin competitors from the Competitors page to track them here.</p>
                )}
              </div>
            </div>

            <div className={card}>
              <h2 className="font-semibold text-ignium-text mb-2">Upcoming stints</h2>
              <div className="grid gap-1 text-sm">
                {upcoming.map((s) => (
                  <div key={s.id} className="text-ignium-mutedLight">
                    Stint {s.stintNumber} — {driverById.get(s.plannedDriverId ?? "")?.name}
                  </div>
                ))}
                {upcoming.length === 0 && <p className="text-ignium-muted">None planned.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Gauge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ignium-panel2 border border-ignium-border rounded p-2">
      <div className="font-display text-2xl font-bold text-ignium-accent">{value}</div>
      <div className="text-xs text-ignium-muted">{label}</div>
    </div>
  );
}
