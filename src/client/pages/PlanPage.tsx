import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api, type Race, type Stint, type Driver, type RaceDriverRow } from "../api";
import { formatMMSS, formatUtcTime, formatLocalTime } from "../../shared/format";

export function PlanPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const [race, setRace] = useState<Race | null>(null);
  const [raceDrivers, setRaceDrivers] = useState<RaceDriverRow[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stints, setStints] = useState<Stint[]>([]);
  const [subsessionId, setSubsessionId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!raceId) return;
    const [raceRes, driversRes, stintsRes] = await Promise.all([
      api.getRace(raceId),
      api.listDrivers(),
      api.listStints(raceId),
    ]);
    setRace(raceRes.race);
    setRaceDrivers(raceRes.raceDrivers);
    setDrivers(driversRes.drivers);
    setStints(stintsRes.stints);
    setSubsessionId(raceRes.race.subsessionId ?? "");
  }, [raceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const driverById = new Map(drivers.map((d) => [d.id, d]));

  async function handleGenerate() {
    if (!raceId) return;
    setError(null);
    try {
      await api.generateSchedule(raceId);
      refresh();
    } catch {
      setError("Could not generate schedule — the race may have already started.");
    }
  }

  async function handleSaveSubsession() {
    if (!raceId) return;
    await api.updateRace(raceId, { subsessionId: subsessionId || null });
    refresh();
  }

  async function handleStintChange(stint: Stint, patch: Partial<Stint>) {
    if (!raceId) return;
    await api.updateStint(raceId, stint.id, patch);
    refresh();
  }

  if (!race) return <p className="text-ignium-muted">Loading...</p>;

  const perDriverTotals = raceDrivers.map((rd) => {
    const mine = stints.filter((s) => s.plannedDriverId === rd.driverId);
    return {
      driver: driverById.get(rd.driverId),
      stintCount: mine.length,
      totalLaps: mine.reduce((sum, s) => sum + s.plannedLaps, 0),
      totalSeconds: mine.reduce((sum, s) => sum + s.plannedLapTimeSeconds * s.plannedLaps, 0),
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-ignium-text tracking-wide">
          {race.name.toUpperCase()} — PLAN
        </h1>
        <button
          onClick={handleGenerate}
          className="bg-ignium-accent text-ignium-onAccent rounded px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:brightness-110 transition"
        >
          {stints.length ? "Regenerate schedule" : "Generate schedule"}
        </button>
      </div>
      {error && <p className="text-ignium-danger text-sm mb-3">{error}</p>}

      <div className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4 mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-ignium-muted">iRacing subsession ID</label>
        <input
          value={subsessionId}
          onChange={(e) => setSubsessionId(e.target.value)}
          placeholder="Set once the session is live"
          className="bg-ignium-panel2 border border-ignium-border text-ignium-text placeholder:text-ignium-muted rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-ignium-accent"
        />
        <button onClick={handleSaveSubsession} className="text-sm font-medium text-ignium-accent hover:underline">
          Save
        </button>
      </div>

      <div className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-ignium-text mb-2">Per-driver totals</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {perDriverTotals.map((t) => (
            <div key={t.driver?.id} className="border border-ignium-border rounded p-3">
              <div className="font-medium text-ignium-text">{t.driver?.name}</div>
              <div className="text-sm text-ignium-muted">
                {t.stintCount} stints — {t.totalLaps} laps — {formatMMSS(t.totalSeconds)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        {stints.map((stint) => {
          const driver = stint.plannedDriverId ? driverById.get(stint.plannedDriverId) : undefined;
          return (
            <div
              key={stint.id}
              className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4 grid sm:grid-cols-6 gap-3 items-center"
            >
              <div className="font-semibold text-ignium-text">
                Stint {stint.stintNumber}
                {stint.isLikelyFinalStint && <span className="text-xs text-ignium-warning block">likely final</span>}
              </div>
              <select
                value={stint.plannedDriverId ?? ""}
                onChange={(e) => handleStintChange(stint, { plannedDriverId: e.target.value || null })}
                className="bg-ignium-panel2 border border-ignium-border text-ignium-text rounded px-2 py-1 text-sm focus:outline-none focus:border-ignium-accent"
                disabled={stint.status !== "planned"}
              >
                {raceDrivers.map((rd) => (
                  <option key={rd.driverId} value={rd.driverId}>
                    {driverById.get(rd.driverId)?.name}
                  </option>
                ))}
              </select>
              <div className="text-sm text-ignium-mutedLight">
                {formatMMSS(stint.lapTimeOverrideSeconds ?? stint.plannedLapTimeSeconds)}/lap ×{" "}
                {stint.lapsOverride ?? stint.plannedLaps} laps
              </div>
              <div className="text-sm text-ignium-mutedLight">{formatUtcTime(stint.plannedStartUtc)}</div>
              <div className="text-sm text-ignium-mutedLight">
                {driver ? `${formatLocalTime(stint.plannedStartUtc, driver.timezone)} (${driver.timezone})` : "—"}
              </div>
              <div className="text-xs uppercase font-medium text-ignium-muted">{stint.status}</div>
            </div>
          );
        })}
        {stints.length === 0 && (
          <p className="text-ignium-muted bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4">
            No schedule yet — click "Generate schedule" above.
          </p>
        )}
      </div>
    </div>
  );
}
