import type { Delta } from "../../shared/raceMath";

const COLORS = {
  better: "bg-ignium-success/15 text-ignium-success",
  worse: "bg-ignium-danger/15 text-ignium-danger",
  onTarget: "bg-ignium-overlay/5 text-ignium-muted",
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
