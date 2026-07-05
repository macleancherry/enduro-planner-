import { useEffect, useState } from "react";
import { api, type Driver } from "../api";

const COMMON_TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [];

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[] | null>(null);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [customerId, setCustomerId] = useState("");

  function refresh() {
    api.listDrivers().then((r) => setDrivers(r.drivers));
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.createDriver({
      name: name.trim(),
      timezone,
      customerId: customerId ? Number(customerId) : null,
    });
    setName("");
    setCustomerId("");
    refresh();
  }

  const inputClass =
    "bg-ignium-panel2 border border-ignium-border text-ignium-text placeholder:text-ignium-muted rounded px-3 py-2 focus:outline-none focus:border-ignium-accent";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ignium-text mb-4 tracking-wide">DRIVER ROSTER</h1>

      <form
        onSubmit={handleAdd}
        className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4 mb-4 grid gap-3 sm:grid-cols-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Driver name"
          className={inputClass}
        />
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
          {(COMMON_TIMEZONES.length ? COMMON_TIMEZONES : ["UTC"]).map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        <input
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="iRacing customer ID (optional)"
          className={inputClass}
        />
        <button
          type="submit"
          className="bg-ignium-accent text-ignium-bg rounded px-4 py-2 font-semibold uppercase tracking-wide hover:brightness-110 transition"
        >
          Add driver
        </button>
      </form>

      <div className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm divide-y divide-ignium-border">
        {drivers?.map((d) => (
          <div key={d.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-ignium-text">{d.name}</div>
              <div className="text-sm text-ignium-muted">
                {d.timezone}
                {d.customerId ? ` — customer ID ${d.customerId}` : ""}
              </div>
            </div>
            <button
              onClick={async () => {
                await api.deleteDriver(d.id);
                refresh();
              }}
              className="text-sm text-ignium-danger hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {drivers?.length === 0 && <p className="px-4 py-3 text-ignium-muted">No drivers yet.</p>}
      </div>
    </div>
  );
}
