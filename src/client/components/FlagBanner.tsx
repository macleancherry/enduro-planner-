import type { RaceFlag } from "../../shared/flags";

const STYLES: Record<RaceFlag, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-200 text-yellow-900 font-bold text-lg py-3",
  red: "bg-red-200 text-red-900 font-bold text-lg py-3",
  white: "bg-slate-200 text-slate-800",
  checkered: "bg-slate-900 text-white font-bold text-lg py-3",
};

const LABELS: Record<RaceFlag, string> = {
  green: "Green flag",
  yellow: "Caution",
  red: "Red flag",
  white: "White flag — last lap",
  checkered: "Checkered flag",
};

export function FlagBanner({ flag }: { flag: RaceFlag | null }) {
  if (!flag) return null;
  return (
    <div className={`rounded-lg px-4 py-2 mb-4 text-center ${STYLES[flag]}`}>{LABELS[flag]}</div>
  );
}
