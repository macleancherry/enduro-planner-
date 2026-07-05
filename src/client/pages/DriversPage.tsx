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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Driver roster</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-lg shadow-sm p-4 mb-4 grid gap-3 sm:grid-cols-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Driver name"
          className="border border-slate-300 rounded px-3 py-2"
        />
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2"
        >
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
          className="border border-slate-300 rounded px-3 py-2"
        />
        <button type="submit" className="bg-slate-900 text-white rounded px-4 py-2 font-medium">
          Add driver
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-sm divide-y divide-slate-100">
        {drivers?.map((d) => (
          <div key={d.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{d.name}</div>
              <div className="text-sm text-slate-500">
                {d.timezone}
                {d.customerId ? ` — customer ID ${d.customerId}` : ""}
              </div>
            </div>
            <button
              onClick={async () => {
                await api.deleteDriver(d.id);
                refresh();
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {drivers?.length === 0 && <p className="px-4 py-3 text-slate-500">No drivers yet.</p>}
      </div>
    </div>
  );
}
