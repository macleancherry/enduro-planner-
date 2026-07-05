import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Race } from "../api";
import { formatUtcTime } from "../../shared/format";

export function RaceListPage() {
  const [races, setRaces] = useState<Race[] | null>(null);

  useEffect(() => {
    api.listRaces().then((r) => setRaces(r.races));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-ignium-text tracking-wide">RACES</h1>
        <Link
          to="/races/new"
          className="bg-ignium-accent text-ignium-onAccent rounded px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:brightness-110 transition"
        >
          New race
        </Link>
      </div>

      {races === null && <p className="text-ignium-muted">Loading...</p>}
      {races?.length === 0 && <p className="text-ignium-muted">No races yet — create your first one.</p>}

      <div className="grid gap-3">
        {races?.map((race) => (
          <div
            key={race.id}
            className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-ignium-text">{race.name}</div>
              <div className="text-sm text-ignium-muted">
                {race.track} — starts {formatUtcTime(race.startTimeUtc)} — car #{race.carNumber}
              </div>
            </div>
            <div className="flex gap-4">
              <Link to={`/races/${race.id}/plan`} className="text-sm font-medium text-ignium-accent hover:underline">
                Plan
              </Link>
              <Link to={`/races/${race.id}/live`} className="text-sm font-medium text-ignium-accent hover:underline">
                Race control
              </Link>
              <Link
                to={`/races/${race.id}/competitors`}
                className="text-sm font-medium text-ignium-accent hover:underline"
              >
                Competitors
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
