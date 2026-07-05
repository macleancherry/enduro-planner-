import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api, type Competitor, type CompetitorStint } from "../api";

export function CompetitorsPage() {
  const { raceId } = useParams<{ raceId: string }>();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [stintsByCompetitor, setStintsByCompetitor] = useState<Record<string, CompetitorStint[]>>({});
  const [name, setName] = useState("");
  const [carNumber, setCarNumber] = useState("");

  const refresh = useCallback(async () => {
    if (!raceId) return;
    const res = await api.listCompetitors(raceId);
    setCompetitors(res.competitors);
    const stintLists = await Promise.all(res.competitors.map((c) => api.listCompetitorStints(raceId, c.id)));
    setStintsByCompetitor(Object.fromEntries(res.competitors.map((c, i) => [c.id, stintLists[i].stints])));
  }, [raceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!raceId || !name.trim() || !carNumber.trim()) return;
    await api.createCompetitor(raceId, { name: name.trim(), carNumber: carNumber.trim() });
    setName("");
    setCarNumber("");
    refresh();
  }

  async function togglePin(competitor: Competitor) {
    if (!raceId) return;
    await api.updateCompetitor(raceId, competitor.id, { isPinned: !competitor.isPinned });
    refresh();
  }

  async function handleAddStint(competitorId: string, form: HTMLFormElement) {
    if (!raceId) return;
    const data = new FormData(form);
    await api.createCompetitorStint(raceId, competitorId, {
      stintNumber: Number(data.get("stintNumber")),
      driverName: String(data.get("driverName") || "") || null,
      laps: data.get("laps") ? Number(data.get("laps")) : null,
      avgLapTimeSeconds: data.get("avgLapTimeSeconds") ? Number(data.get("avgLapTimeSeconds")) : null,
      notes: String(data.get("notes") || "") || null,
    });
    form.reset();
    refresh();
  }

  const smallInput = "bg-ignium-panel2 border border-ignium-border text-ignium-text placeholder:text-ignium-muted rounded px-2 py-1 text-sm focus:outline-none focus:border-ignium-accent";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ignium-text mb-4 tracking-wide">COMPETITORS</h1>

      <form onSubmit={handleAdd} className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4 mb-4 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Competitor / team name"
          className="bg-ignium-panel2 border border-ignium-border text-ignium-text placeholder:text-ignium-muted rounded px-3 py-2 flex-1 focus:outline-none focus:border-ignium-accent"
        />
        <input
          value={carNumber}
          onChange={(e) => setCarNumber(e.target.value)}
          placeholder="Car #"
          className="bg-ignium-panel2 border border-ignium-border text-ignium-text placeholder:text-ignium-muted rounded px-3 py-2 w-24 focus:outline-none focus:border-ignium-accent"
        />
        <button type="submit" className="bg-ignium-accent text-ignium-bg rounded px-4 py-2 font-semibold uppercase tracking-wide hover:brightness-110 transition">
          Add
        </button>
      </form>

      <div className="grid gap-3">
        {competitors.map((c) => (
          <div key={c.id} className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-ignium-text">
                #{c.carNumber} — {c.name}
              </div>
              <button
                onClick={() => togglePin(c)}
                className={`text-sm font-medium ${c.isPinned ? "text-ignium-warning" : "text-ignium-muted"}`}
              >
                {c.isPinned ? "★ Pinned" : "☆ Pin to watchlist"}
              </button>
            </div>

            <div className="text-sm text-ignium-mutedLight mb-2">
              {stintsByCompetitor[c.id]?.map((s) => (
                <div key={s.id}>
                  Stint {s.stintNumber}
                  {s.driverName ? ` — ${s.driverName}` : ""}
                  {s.laps != null ? ` — ${s.laps} laps` : ""}
                  {s.avgLapTimeSeconds != null ? ` — avg ${s.avgLapTimeSeconds}s` : ""}
                  {s.notes ? ` — ${s.notes}` : ""}
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddStint(c.id, e.currentTarget);
              }}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2"
            >
              <input name="stintNumber" type="number" placeholder="Stint #" className={smallInput} required />
              <input name="driverName" placeholder="Driver" className={smallInput} />
              <input name="laps" type="number" placeholder="Laps" className={smallInput} />
              <input name="avgLapTimeSeconds" type="number" placeholder="Avg lap (s)" className={smallInput} />
              <input name="notes" placeholder="Notes" className={smallInput} />
              <button type="submit" className="col-span-2 sm:col-span-5 text-sm font-medium text-ignium-accent hover:underline text-left">
                + Log stint
              </button>
            </form>
          </div>
        ))}
        {competitors.length === 0 && (
          <p className="text-ignium-muted bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4">No competitors added yet.</p>
        )}
      </div>
    </div>
  );
}
