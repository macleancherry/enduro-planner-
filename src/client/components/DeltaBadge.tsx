import type { Delta } from "../../shared/raceMath";

const COLORS = {
  better: "bg-green-100 text-green-800",
  worse: "bg-red-100 text-red-800",
  onTarget: "bg-slate-100 text-slate-700",
};

export function DeltaBadge({ delta, unit, compact }: { delta: Delta; unit: string; compact?: boolean }) {
  const sign = delta.value > 0 ? "+" : "";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${COLORS[delta.direction]} ${
        compact ? "" : "text-sm px-3 py-1"
      }`}
    >
      {sign}
      {delta.value.toFixed(2)} {unit}
    </span>
  );
}
