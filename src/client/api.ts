async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `request_failed_${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface Driver {
  id: string;
  name: string;
  timezone: string;
  customerId: number | null;
}

export interface Race {
  id: string;
  name: string;
  track: string;
  startTimeUtc: string;
  durationSeconds: number;
  tankSizeLiters: number;
  defaultFuelPerLapLiters: number;
  defaultLapTimeSeconds: number;
  pitLaneDriveTimeSeconds: number;
  fuelFlowRateSecPerLiter: number;
  carNumber: string;
  subsessionId: string | null;
}

export interface RaceDriverRow {
  id: string;
  raceId: string;
  driverId: string;
  order: number;
  lapTimeOverrideSeconds: number | null;
  fuelPerLapOverride: number | null;
  lapsPerTankOverride: number | null;
}

export interface Stint {
  id: string;
  raceId: string;
  stintNumber: number;
  plannedDriverId: string | null;
  actualDriverId: string | null;
  plannedLapTimeSeconds: number;
  plannedLaps: number;
  plannedFuelPerLapLiters: number;
  lapTimeOverrideSeconds: number | null;
  fuelPerLapOverride: number | null;
  lapsOverride: number | null;
  plannedStartUtc: string;
  plannedEndUtc: string;
  isLikelyFinalStint: boolean;
  actualStartUtc: string | null;
  actualEndUtc: string | null;
  actualLaps: number | null;
  actualStintTimeSeconds: number | null;
  fuelAddedLiters: number | null;
  fuelLevelAtStintStartLiters: number | null;
  fuelLevelAtStintEndLiters: number | null;
  status: "planned" | "active" | "completed";
}

export interface Competitor {
  id: string;
  raceId: string;
  name: string;
  carNumber: string;
  isPinned: boolean;
}

export interface CompetitorStint {
  id: string;
  competitorId: string;
  stintNumber: number;
  driverName: string | null;
  startUtc: string | null;
  endUtc: string | null;
  laps: number | null;
  avgLapTimeSeconds: number | null;
  notes: string | null;
}

export interface LeaderboardRow {
  position: number;
  classPosition: number;
  classShortName: string | null;
  carNumber: string;
  driverName: string;
  teamName: string | null;
  customerId: number;
  gapSeconds: number | null;
  intervalSeconds: number | null;
  lastLapSeconds: number | null;
  bestLapSeconds: number | null;
  inPits: boolean;
  lapsSincePit: number | null;
  isOurCar: boolean;
  isPinnedCompetitor: boolean;
}

export interface TelemetryLap {
  id: string;
  lapNumber: number;
  lapTimeSeconds: number;
  fuelLevelLiters: number | null;
  fuelUsedLiters: number | null;
}

export interface LiveSnapshot {
  live: {
    leaderboard: LeaderboardRow[];
    ownCar: {
      carNumber: string;
      driverName: string;
      lap: number;
      lastLapSeconds: number | null;
      bestLapSeconds: number | null;
      inPits: boolean;
    } | null;
    recentLaps: TelemetryLap[];
    driverSwapCandidate: { telemetryCustomerId: number; mappedDriverId: string; mappedDriverName: string } | null;
    flag: "green" | "yellow" | "red" | "white" | "checkered" | null;
  } | null;
}

export const api = {
  login: (passcode: string) => request<{ ok: boolean }>("/login", { method: "POST", body: JSON.stringify({ passcode }) }),
  logout: () => request<{ ok: boolean }>("/logout", { method: "POST" }),

  listDrivers: () => request<{ drivers: Driver[] }>("/drivers"),
  createDriver: (input: Partial<Driver>) =>
    request<{ driver: Driver }>("/drivers", { method: "POST", body: JSON.stringify(input) }),
  updateDriver: (id: string, input: Partial<Driver>) =>
    request<{ driver: Driver }>(`/drivers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteDriver: (id: string) => request<{ ok: boolean }>(`/drivers/${id}`, { method: "DELETE" }),

  listRaces: () => request<{ races: Race[] }>("/races"),
  createRace: (input: Partial<Race> & { driverIds: string[] }) =>
    request<{ race: Race }>("/races", { method: "POST", body: JSON.stringify(input) }),
  getRace: (id: string) => request<{ race: Race; raceDrivers: RaceDriverRow[] }>(`/races/${id}`),
  updateRace: (id: string, input: Partial<Race>) =>
    request<{ race: Race }>(`/races/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  generateSchedule: (raceId: string) =>
    request<{ stints: Stint[] }>(`/races/${raceId}/schedule`, { method: "POST" }),

  listStints: (raceId: string) => request<{ stints: Stint[] }>(`/races/${raceId}/stints`),
  updateStint: (raceId: string, stintId: string, input: Partial<Stint>) =>
    request<{ stint: Stint }>(`/races/${raceId}/stints/${stintId}`, { method: "PATCH", body: JSON.stringify(input) }),
  startStint: (raceId: string, stintId: string, actualDriverId?: string) =>
    request<{ stint: Stint }>(`/races/${raceId}/stints/${stintId}/start`, {
      method: "POST",
      body: JSON.stringify({ actualDriverId }),
    }),
  endStint: (
    raceId: string,
    stintId: string,
    input: { actualLaps: number; actualStintTimeSeconds: number; fuelAddedLiters: number | null }
  ) =>
    request<{ stint: Stint }>(`/races/${raceId}/stints/${stintId}/end`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listCompetitors: (raceId: string) => request<{ competitors: Competitor[] }>(`/races/${raceId}/competitors`),
  createCompetitor: (raceId: string, input: { name: string; carNumber: string }) =>
    request<{ competitor: Competitor }>(`/races/${raceId}/competitors`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCompetitor: (raceId: string, competitorId: string, input: Partial<Competitor>) =>
    request<{ competitor: Competitor }>(`/races/${raceId}/competitors/${competitorId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  listCompetitorStints: (raceId: string, competitorId: string) =>
    request<{ stints: CompetitorStint[] }>(`/races/${raceId}/competitors/${competitorId}/stints`),
  createCompetitorStint: (raceId: string, competitorId: string, input: Partial<CompetitorStint>) =>
    request<{ stint: CompetitorStint }>(`/races/${raceId}/competitors/${competitorId}/stints`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getLive: (raceId: string) => request<LiveSnapshot>(`/races/${raceId}/live`),
};
