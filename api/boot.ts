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

// When backend env vars are not configured yet, fail API requests
// per-request with a clean JSON 503 instead of crashing/throwing deep
// inside a procedure (or leaking a raw connection error). This applies
// everywhere — not just Vercel — so local `npm run dev` behaves the same
// documented way as production: page shells render, cart works client-
// side, and API-backed data shows a clean error instead of a slow,
// retried, uncaught exception.
if (!env.databaseUrl) {
  app.use("/api/*", async (c, next) => {
    // SalesAgent-only procedures don't call getDb() at all — don't block
    // them just because the (separate, optional) local database isn't
    // configured. tRPC's single-call URLs include the procedure name
    // (e.g. /api/trpc/products.salesAgentCategories), so this is a simple,
    // safe string check rather than a deep change to request routing.
    if (c.req.path.includes("salesAgent")) return next();
    return c.json(
      {
        error:
          "Backend not configured — set DATABASE_URL / auth env vars in your environment.",
      },
      503,
    );
  });
}
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
