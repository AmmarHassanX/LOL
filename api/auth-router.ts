import * as cookie from "cookie";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./kimi/session";
import { findUserByEmail, upsertUser } from "./queries/users";
import { getDb } from "./queries/connection";
import { businessProfiles, users } from "@db/schema";
import { hashPassword, verifyPassword } from "./lib/password";
import { env } from "./lib/env";

/**
 * Standalone email/password auth — replaces the original "Sign in with
 * Kimi" OAuth flow, which logged people into a Kimi AI platform account.
 * That made sense for a Kimi platform app; it made no sense for a real
 * wholesale distributor's customers, who have no reason to have a Kimi
 * account. The session mechanism itself (signSessionToken / the
 * `mbw_sid` cookie / authedQuery) was already fully generic — only the
 * "how does a session get created in the first place" step needed
 * replacing. `unionId` (the users table's existing unique key, previously
 * populated from the Kimi user id) is repurposed here as the user's
 * lowercased email — a normal, sensible identifier for standalone auth.
 *
 * `register` collects the full wholesale application in one submission
 * (per Ammar's spec: owner name, email, phone, company as shown on the
 * tax ID, tax ID, FEIN, tobacco license, and address) and creates the
 * account in "pending" status — no session is issued. `login` checks
 * that status and refuses pending/rejected accounts with a clear message
 * instead of letting them in. Actual approval happens via
 * admin-router.ts, by a staff member with the "admin" role.
 *
 * NOTE on atomicity: this creates a `users` row and then a
 * `businessProfiles` row as two separate inserts, not inside a single
 * database transaction. That's not an oversight — the Neon HTTP driver
 * this project uses (chosen for Vercel's serverless model) genuinely
 * does not support interactive transactions; only its slower WebSocket
 * driver does, which isn't worth switching the whole app to for this one
 * flow. If the second insert fails, the just-created user row is deleted
 * as a best-effort compensating action so a failed application doesn't
 * leave a stray, profile-less account behind.
 */

async function issueSession(ctx: { resHeaders: Headers; req: Request }, unionId: string) {
  const token = await signSessionToken({ unionId, clientId: env.appId });
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

const emailSchema = z.string().email().max(320).transform((s) => s.toLowerCase().trim());
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(255);
const requiredStr = (label: string, max = 255) => z.string().trim().min(1, `${label} is required`).max(max);

const registerInput = z.object({
  // Owner / manager
  firstName: requiredStr("First name"),
  lastName: requiredStr("Last name"),
  email: emailSchema,
  password: passwordSchema,
  phone: requiredStr("Phone"),
  // Company
  company: requiredStr("Company name"),
  dbaName: z.string().max(255).optional(),
  businessType: z
    .enum(["c-store", "gas-station", "restaurant", "smoke-shop", "market", "other"])
    .optional(),
  // Address
  address1: requiredStr("Address"),
  address2: z.string().max(255).optional(),
  city: requiredStr("City"),
  state: requiredStr("State", 2),
  zip: requiredStr("ZIP", 10),
  county: z.string().max(100).optional(),
  country: z.string().max(2).default("US"),
  // Tax / license — taxId, feinNumber, tobaccoId required; rest optional
  taxId: requiredStr("Tax ID", 64),
  feinNumber: requiredStr("FEIN number", 64),
  tobaccoId: requiredStr("Tobacco license number", 64),
  tobaccoLicenseExpiration: z.coerce.date().optional(),
  cigaretteId: z.string().max(64).optional(),
  cigaretteLicenseExpiration: z.coerce.date().optional(),
  vaporTaxId: z.string().max(64).optional(),
  vaporTaxExpiration: z.coerce.date().optional(),
  salesTaxId: z.string().max(64).optional(),
  salesTaxExpiration: z.coerce.date().optional(),
  hempLicenseNumber: z.string().max(64).optional(),
  hempLicenseExpiration: z.coerce.date().optional(),
  drivingLicenseNumber: z.string().max(64).optional(),
  bankName: z.string().max(255).optional(),
});

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  register: publicQuery.input(registerInput).mutation(async ({ input }) => {
    const existing = await findUserByEmail(input.email);
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An account with this email already exists — try signing in instead.",
      });
    }

    const passwordHash = await hashPassword(input.password);
    const db = getDb();

    await upsertUser({
      unionId: input.email,
      email: input.email,
      name: `${input.firstName} ${input.lastName}`.trim(),
      passwordHash,
      accountStatus: "pending",
    });
    const user = await findUserByEmail(input.email);
    if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create account." });

    try {
      await db.insert(businessProfiles).values({
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        company: input.company,
        dbaName: input.dbaName ?? null,
        businessType: input.businessType ?? null,
        address1: input.address1,
        address2: input.address2 ?? null,
        city: input.city,
        state: input.state.toUpperCase(),
        zip: input.zip,
        county: input.county ?? null,
        country: input.country.toUpperCase(),
        taxId: input.taxId,
        feinNumber: input.feinNumber,
        tobaccoId: input.tobaccoId,
        tobaccoLicenseExpiration: input.tobaccoLicenseExpiration ?? null,
        cigaretteId: input.cigaretteId ?? null,
        cigaretteLicenseExpiration: input.cigaretteLicenseExpiration ?? null,
        vaporTaxId: input.vaporTaxId ?? null,
        vaporTaxExpiration: input.vaporTaxExpiration ?? null,
        salesTaxId: input.salesTaxId ?? null,
        salesTaxExpiration: input.salesTaxExpiration ?? null,
        hempLicenseNumber: input.hempLicenseNumber ?? null,
        hempLicenseExpiration: input.hempLicenseExpiration ?? null,
        drivingLicenseNumber: input.drivingLicenseNumber ?? null,
        bankName: input.bankName ?? null,
      });
    } catch (err) {
      // Compensating action — see the file-header note on why this isn't
      // a real transaction. Don't leave a profile-less account behind.
      await db.delete(users).where(eq(users.id, user.id));
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not save your business information — please try again.",
      });
    }

    return {
      status: "pending" as const,
      message:
        "Thanks for applying! We review new wholesale accounts within 1-2 business days. We'll email you once your account is approved.",
    };
  }),

  login: publicQuery
    .input(z.object({ email: emailSchema, password: passwordSchema }))
    .mutation(async ({ ctx, input }) => {
      const invalidCreds = () =>
        new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });

      const user = await findUserByEmail(input.email);
      if (!user || !user.passwordHash) throw invalidCreds();

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) throw invalidCreds();

      if (user.accountStatus === "pending") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Your application is still under review. We typically review new wholesale accounts within 1-2 business days.",
        });
      }
      if (user.accountStatus === "rejected") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            user.accountStatusNote ||
            "Your application wasn't approved. Contact us if you have questions.",
        });
      }

      await issueSession(ctx, input.email);
      return user;
    }),
});
