import { Hono } from "hono";
import type { Env } from "./env";
import { passcodeGate } from "./middleware/passcode";
import { loginRoutes } from "./routes/login";
import { driverRoutes } from "./routes/drivers";
import { raceRoutes } from "./routes/races";
import { stintRoutes } from "./routes/stints";
import { competitorRoutes } from "./routes/competitors";
import { liveRoutes } from "./routes/live";

const app = new Hono<{ Bindings: Env }>();

app.route("/api", loginRoutes);

const protectedApi = new Hono<{ Bindings: Env }>();
protectedApi.use("*", passcodeGate);
protectedApi.route("/", driverRoutes);
protectedApi.route("/", raceRoutes);
protectedApi.route("/", stintRoutes);
protectedApi.route("/", competitorRoutes);
protectedApi.route("/", liveRoutes);
app.route("/api", protectedApi);

app.notFound((c) => {
  if (new URL(c.req.url).pathname.startsWith("/api/")) {
    return c.json({ error: "not_found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
