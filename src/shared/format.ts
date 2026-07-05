export function formatMMSS(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "-" : "";
  const s = Math.abs(Math.round(totalSeconds));
  return `${sign}${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function parseMMSS(input: string): number {
  const m = input.trim().match(/^(-?)(\d+):(\d{2}(?:\.\d+)?)$/);
  if (!m) return NaN;
  const [, sign, mm, ss] = m;
  return (sign ? -1 : 1) * (Number(mm) * 60 + Number(ss));
}

export function formatLocalTime(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(isoUtc));
}

export function formatUtcTime(isoUtc: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(isoUtc)) + " UTC";
}
