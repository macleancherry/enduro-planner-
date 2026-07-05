export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  PASSCODE: string;
  PASSCODE_HMAC_SECRET: string;
  LIVE_WORKER_URL: string;
}
