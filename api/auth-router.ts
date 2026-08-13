import * as cookie from "cookie";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./kimi/session";
import { findUserByEmail, upsertUser } from "./queries/users";
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

  register: publicQuery
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
        name: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists — try signing in instead.",
        });
      }
      const passwordHash = await hashPassword(input.password);
      await upsertUser({
        unionId: input.email,
        email: input.email,
        name: input.name ?? null,
        passwordHash,
      });
      await issueSession(ctx, input.email);
      const user = await findUserByEmail(input.email);
      return user;
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

      await issueSession(ctx, input.email);
      return user;
    }),
});
