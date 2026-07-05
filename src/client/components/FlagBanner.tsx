import type { RaceFlag } from "../../shared/flags";

const STYLES: Record<RaceFlag, string> = {
  green: "bg-ignium-success/15 text-ignium-success border border-ignium-success/30",
  yellow: "bg-ignium-warning/20 text-ignium-warning border border-ignium-warning/40 font-bold text-lg py-3",
  red: "bg-ignium-danger/20 text-ignium-danger border border-ignium-danger/40 font-bold text-lg py-3",
  white: "bg-white/10 text-ignium-text border border-white/20",
  checkered: "bg-ignium-text text-ignium-bg font-bold text-lg py-3",
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
    <div className={`rounded-lg px-4 py-2 mb-4 text-center font-display tracking-wide ${STYLES[flag]}`}>
      {LABELS[flag]}
    </div>
  );
}
