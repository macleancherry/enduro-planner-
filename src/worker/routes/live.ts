import { Hono } from "hono";
import type { Env } from "../env";
import { buildLiveSnapshot } from "../live";

export const liveRoutes = new Hono<{ Bindings: Env }>();

liveRoutes.get("/races/:raceId/live", async (c) => {
  const snapshot = await buildLiveSnapshot(c.env, c.req.param("raceId"));
  return c.json(snapshot);
});
