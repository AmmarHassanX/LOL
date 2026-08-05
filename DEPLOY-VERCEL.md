# Deploying to Vercel

This repo deploys to Vercel with **zero dashboard configuration** — `vercel.json` at the repo root handles everything:

- **Frontend**: `npm run build` outputs the Vite SPA to `dist/public`, which `@vercel/static-build` publishes as static files. All non-API routes fall back to `index.html` (SPA rewrite), so client-side routes like `/products` or `/account` work on refresh/deep-link.
- **Backend**: ALL `/api/*` requests are routed to a single serverless function built from `api/vercel.ts` (the existing Hono app — tRPC + OAuth callback — adapted via `@hono/node-server`'s `getRequestListener`). The other files under `api/` are just source; they do **not** become separate functions.

## Steps

1. Push this branch and import the repo at https://vercel.com/new.
2. Framework preset: **"Other"** — leave all build settings empty (no overrides needed; `vercel.json` takes over).
3. Deploy. The site (home, about, contact, products page shells, cart) works immediately.

## Environment variables (Project Settings → Environment Variables)

Without env vars the API returns a clean JSON `503` (`{"error":"Backend not configured — ..."}`) instead of crashing; the frontend still renders and the cart keeps working client-side. Set these to enable the backend:

| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Catalog, auth, orders, contact form | MySQL connection string for your own (or ERP-backed) database. |
| `APP_ID` / `APP_SECRET` | Kimi OAuth login | Only needed if keeping Kimi login. |
| `KIMI_AUTH_URL` / `KIMI_OPEN_URL` | Kimi OAuth login | Only needed if keeping Kimi login. |

> **Note:** Kimi login is specific to the Kimi platform and will be replaced by ERP auth. If you don't set the Kimi vars, login simply returns an auth error while the rest of the site works. `DATABASE_URL` alone is enough for the public catalog and contact form.

## What works when

- **No env vars**: all page shells render; cart works fully client-side; API-backed data (product catalog, auth, orders) shows graceful error/empty states.
- **`DATABASE_URL` set**: product catalog, contact form, and (after running migrations with `npm run db:push`/`db:migrate`) order storage.
- **All vars set**: everything, including Kimi OAuth login.

## Local sanity checks (already wired into this repo)

```bash
npm run check   # typecheck
npm run build   # vite build → dist/public + server bundle → dist/boot.js
```
