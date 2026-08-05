import "dotenv/config";

/**
 * Vercel sets VERCEL=1 in build and serverless runtime. There we must NOT
 * throw at import time (a throw would crash the whole function and return a
 * generic 500 for every request); instead we degrade gracefully and fail
 * per-request with a clean JSON 503 from api/boot.ts.
 * On the Kimi platform (production, not Vercel) the original strict behavior
 * is unchanged.
 */
const isVercel = !!process.env.VERCEL;

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production" && !isVercel) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  isVercel,
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
