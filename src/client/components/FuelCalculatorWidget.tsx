import { useState } from "react";
import { fuelCalculator } from "../../shared/raceMath";
import { formatMMSS, parseMMSS } from "../../shared/format";

export function FuelCalculatorWidget({
  defaultLapTimeSeconds,
  defaultFuelPerLapLiters,
  tankSizeLiters,
}: {
  defaultLapTimeSeconds: number;
  defaultFuelPerLapLiters: number;
  tankSizeLiters: number;
}) {
  const [lapTime, setLapTime] = useState(formatMMSS(defaultLapTimeSeconds));
  const [raceTimeRemaining, setRaceTimeRemaining] = useState("4:00:00");
  const [currentFuel, setCurrentFuel] = useState(String(tankSizeLiters));
  const [fuelBurn, setFuelBurn] = useState(String(defaultFuelPerLapLiters));
  const [maxTank, setMaxTank] = useState(String(tankSizeLiters));

  const lapTimeSeconds = parseMMSS(lapTime);
  const raceTimeParts = raceTimeRemaining.split(":").map(Number);
  const raceTimeRemainingSeconds =
    raceTimeParts.length === 3 ? raceTimeParts[0] * 3600 + raceTimeParts[1] * 60 + raceTimeParts[2] : NaN;

  const result =
    !Number.isNaN(lapTimeSeconds) && !Number.isNaN(raceTimeRemainingSeconds) && Number(fuelBurn) > 0
      ? fuelCalculator(lapTimeSeconds, raceTimeRemainingSeconds, Number(currentFuel), Number(fuelBurn), Number(maxTank))
      : null;

  const inputClass =
    "w-full bg-ignium-panel2 border border-ignium-border text-ignium-text rounded px-2 py-1 mt-0.5 focus:outline-none focus:border-ignium-accent";

  return (
    <div className="bg-ignium-panel border border-ignium-border rounded-lg shadow-sm p-4">
      <h2 className="font-semibold text-ignium-text mb-2">Fuel calculator</h2>
      <div className="grid grid-cols-2 gap-2 text-sm mb-3 text-ignium-muted">
        <label>
          Lap time (mm:ss)
          <input value={lapTime} onChange={(e) => setLapTime(e.target.value)} className={inputClass} />
        </label>
        <label>
          Race time left (h:mm:ss)
          <input
            value={raceTimeRemaining}
            onChange={(e) => setRaceTimeRemaining(e.target.value)}
            className={inputClass}
          />
        </label>
        <label>
          Current fuel (L)
          <input value={currentFuel} onChange={(e) => setCurrentFuel(e.target.value)} className={inputClass} />
        </label>
        <label>
          Burn per lap (L)
          <input value={fuelBurn} onChange={(e) => setFuelBurn(e.target.value)} className={inputClass} />
        </label>
        <label>
          Max tank (L)
          <input value={maxTank} onChange={(e) => setMaxTank(e.target.value)} className={inputClass} />
        </label>
      </div>
      {result && (
        <div className="text-sm bg-ignium-panel2 border border-ignium-border rounded p-2 text-ignium-text">
          <div>Laps remaining: {result.lapsRemaining.toFixed(1)}</div>
          <div>Fuel to add for finish: {result.fuelToAddForFinishLiters.toFixed(1)} L</div>
          <div>Pit stops remaining: {result.pitStopsRemaining}</div>
        </div>
      )}
    </div>
  );
}
