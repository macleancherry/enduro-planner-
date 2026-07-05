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

  if (!race) return <p className="text-slate-500">Loading...</p>;

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
        <h1 className="text-2xl font-bold text-slate-900">{race.name} — Plan</h1>
        <button onClick={handleGenerate} className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium">
          {stints.length ? "Regenerate schedule" : "Generate schedule"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">iRacing subsession ID</label>
        <input
          value={subsessionId}
          onChange={(e) => setSubsessionId(e.target.value)}
          placeholder="Set once the session is live"
          className="border border-slate-300 rounded px-3 py-2 text-sm flex-1"
        />
        <button onClick={handleSaveSubsession} className="text-sm font-medium text-slate-700 hover:underline">
          Save
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-slate-900 mb-2">Per-driver totals</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {perDriverTotals.map((t) => (
            <div key={t.driver?.id} className="border border-slate-200 rounded p-3">
              <div className="font-medium text-slate-900">{t.driver?.name}</div>
              <div className="text-sm text-slate-500">
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
            <div key={stint.id} className="bg-white rounded-lg shadow-sm p-4 grid sm:grid-cols-6 gap-3 items-center">
              <div className="font-semibold text-slate-900">
                Stint {stint.stintNumber}
                {stint.isLikelyFinalStint && <span className="text-xs text-amber-600 block">likely final</span>}
              </div>
              <select
                value={stint.plannedDriverId ?? ""}
                onChange={(e) => handleStintChange(stint, { plannedDriverId: e.target.value || null })}
                className="border border-slate-300 rounded px-2 py-1 text-sm"
                disabled={stint.status !== "planned"}
              >
                {raceDrivers.map((rd) => (
                  <option key={rd.driverId} value={rd.driverId}>
                    {driverById.get(rd.driverId)?.name}
                  </option>
                ))}
              </select>
              <div className="text-sm text-slate-600">
                {formatMMSS(stint.lapTimeOverrideSeconds ?? stint.plannedLapTimeSeconds)}/lap ×{" "}
                {stint.lapsOverride ?? stint.plannedLaps} laps
              </div>
              <div className="text-sm text-slate-600">{formatUtcTime(stint.plannedStartUtc)}</div>
              <div className="text-sm text-slate-600">
                {driver ? `${formatLocalTime(stint.plannedStartUtc, driver.timezone)} (${driver.timezone})` : "—"}
              </div>
              <div className="text-xs uppercase font-medium text-slate-500">{stint.status}</div>
            </div>
          );
        })}
        {stints.length === 0 && (
          <p className="text-slate-500 bg-white rounded-lg shadow-sm p-4">
            No schedule yet — click "Generate schedule" above.
          </p>
        )}
      </div>
    </div>
  );
}
