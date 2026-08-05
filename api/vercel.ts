import { getRequestListener } from "@hono/node-server";
import app from "./boot";

/**
 * Vercel serverless entry point.
 *
 * Reuses the Hono app built in ./boot (routes, tRPC, OAuth callback) WITHOUT
 * starting a long-lived Node server. `getRequestListener` adapts the app's
 * Web-standard fetch handler to the classic Node (req, res) signature that
 * @vercel/node invokes.
 */
export default getRequestListener(app.fetch);
