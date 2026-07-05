import type { ReactNode } from "react";

// Real enforcement happens server-side: every /api/* route requires the passcode cookie, and
// the client's fetch wrapper (see api.ts) redirects to /login on any 401. This component is
// just a placeholder seam in the route tree in case client-side pre-checks are ever needed.
export function AuthGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
