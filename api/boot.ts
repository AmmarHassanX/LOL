import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// NOTE: there used to be a blanket "no DATABASE_URL configured -> return a
// raw JSON 503 for all /api/*" guard here. It caused a worse problem than
// the one it solved: that raw JSON isn't shaped the way the tRPC client
// expects, so instead of showing a clean error message, the frontend
// failed with a confusing "Unable to transform response from server".
// tRPC's own error handling (getDb() throwing inside a procedure) already
// produces a properly-shaped, frontend-parseable error — it was just slow
// by default. That's fixed at the source now: the QueryClient in
// src/providers/trpc.tsx defaults every query/mutation to retry: false,
// so failures surface in under a second instead of after 7-10s of retries.
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// Start a long-lived Node server only outside Vercel (on Vercel the app is
// served by the serverless function in api/vercel.ts).
if (env.isProduction && !env.isVercel) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
