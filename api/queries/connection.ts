import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured — set it in environment/project settings",
    );
  }
  if (!instance) {
    instance = drizzle(env.databaseUrl, { schema: fullSchema });
  }
  return instance;
}
