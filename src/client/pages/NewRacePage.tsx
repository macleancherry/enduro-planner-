import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Driver } from "../api";
import { parseMMSS } from "../../shared/format";

export function NewRacePage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    track: "",
    startTimeUtc: "",
    durationHours: "24",
    tankSizeLiters: "100",
    defaultFuelPerLapLiters: "4.0",
    defaultLapTime: "2:17",
    pitLaneDriveTimeSeconds: "20",
    fuelFlowRateSecPerLiter: "0.693",
    carNumber: "",
    subsessionId: "",
  });

  useEffect(() => {
    api.listDrivers().then((r) => setDrivers(r.drivers));
  }, []);

  function toggleDriver(id: string) {
    setSelectedDriverIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const lapTimeSeconds = parseMMSS(form.defaultLapTime);
    if (Number.isNaN(lapTimeSeconds)) {
      setError("Default lap time must be in mm:ss format, e.g. 2:17");
      return;
    }
    if (selectedDriverIds.length === 0) {
      setError("Select at least one driver");
      return;
    }

    setSubmitting(true);
    try {
      const race = await api.createRace({
        name: form.name,
        track: form.track,
        startTimeUtc: new Date(form.startTimeUtc).toISOString(),
        durationSeconds: Math.round(Number(form.durationHours) * 3600),
        tankSizeLiters: Number(form.tankSizeLiters),
        defaultFuelPerLapLiters: Number(form.defaultFuelPerLapLiters),
        defaultLapTimeSeconds: lapTimeSeconds,
        pitLaneDriveTimeSeconds: Number(form.pitLaneDriveTimeSeconds),
        fuelFlowRateSecPerLiter: Number(form.fuelFlowRateSecPerLiter),
        carNumber: form.carNumber,
        subsessionId: form.subsessionId || null,
        driverIds: selectedDriverIds,
      });
      navigate(`/races/${race.race.id}/plan`);
    } catch {
      setError("Could not create race — check the fields above");
    } finally {
      setSubmitting(false);
    }
  }

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <label className="block">
      <span className="text-sm font-medium text-ignium-muted">{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-1 w-full bg-ignium-panel2 border border-ignium-border text-ignium-text rounded px-3 py-2 focus:outline-none focus:border-ignium-accent"
      />
    </label>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-ignium-text mb-4 tracking-wide">NEW RACE</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-6 grid gap-4 sm:grid-cols-2"
      >
        {field("Race name", "name")}
        {field("Track", "track")}
        {field("Start time (your local time)", "startTimeUtc", "datetime-local")}
        {field("Duration (hours)", "durationHours", "number")}
        {field("Tank size (L)", "tankSizeLiters", "number")}
        {field("Default fuel per lap (L)", "defaultFuelPerLapLiters", "number")}
        {field("Default lap time (mm:ss)", "defaultLapTime")}
        {field("Pit lane drive time (s)", "pitLaneDriveTimeSeconds", "number")}
        {field("Fuel flow rate (s/L)", "fuelFlowRateSecPerLiter", "number")}
        {field("Our car number", "carNumber")}
        {field("iRacing subsession ID (optional, can add later)", "subsessionId")}

        <div className="sm:col-span-2">
          <span className="text-sm font-medium text-ignium-muted">Drivers for this race</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {drivers.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm text-ignium-text">
                <input
                  type="checkbox"
                  checked={selectedDriverIds.includes(d.id)}
                  onChange={() => toggleDriver(d.id)}
                  className="accent-ignium-accent"
                />
                {d.name}
              </label>
            ))}
            {drivers.length === 0 && (
              <p className="text-sm text-ignium-muted col-span-2">No drivers yet — add some on the Drivers page.</p>
            )}
          </div>
        </div>

        {error && <p className="text-ignium-danger text-sm sm:col-span-2">{error}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-ignium-accent text-ignium-onAccent rounded px-4 py-2 font-semibold uppercase tracking-wide disabled:opacity-50 hover:brightness-110 transition"
          >
            {submitting ? "Creating..." : "Create race"}
          </button>
        </div>
      </form>
    </div>
  );
}
