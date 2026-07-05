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
        <h1 className="text-2xl font-bold text-slate-900">Races</h1>
        <Link to="/races/new" className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium">
          New race
        </Link>
      </div>

      {races === null && <p className="text-slate-500">Loading...</p>}
      {races?.length === 0 && <p className="text-slate-500">No races yet — create your first one.</p>}

      <div className="grid gap-3">
        {races?.map((race) => (
          <div key={race.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">{race.name}</div>
              <div className="text-sm text-slate-500">
                {race.track} — starts {formatUtcTime(race.startTimeUtc)} — car #{race.carNumber}
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/races/${race.id}/plan`} className="text-sm font-medium text-slate-700 hover:underline">
                Plan
              </Link>
              <Link to={`/races/${race.id}/live`} className="text-sm font-medium text-slate-700 hover:underline">
                Race control
              </Link>
              <Link
                to={`/races/${race.id}/competitors`}
                className="text-sm font-medium text-slate-700 hover:underline"
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
