import { eq } from "drizzle-orm";
import { z } from "zod";
import { businessProfiles } from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, authedQuery } from "./middleware";

const businessTypeEnum = z.enum([
  "c-store",
  "gas-station",
  "restaurant",
  "smoke-shop",
  "market",
  "other",
]);

/** For editing an already-approved account's profile. The full compliance
 *  application (with the tax/license fields) lives in auth-router.ts's
 *  `register` — this covers the fields someone might reasonably update
 *  later (moved locations, new phone, etc.), not the whole application. */
const upsertInput = z.object({
  company: z.string().min(1).max(255),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  phone: z.string().max(40),
  businessType: businessTypeEnum.optional(),
  address1: z.string().max(255),
  city: z.string().max(100),
  state: z.string().max(2),
  zip: z
    .string()
    .regex(/^\d{5}$/, "ZIP must be 5 digits"),
  taxId: z.string().max(64),
  feinNumber: z.string().max(64),
  tobaccoId: z.string().max(64),
});

export const profileRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const profile = await getDb().query.businessProfiles.findFirst({
      where: eq(businessProfiles.userId, ctx.user.id),
    });
    return profile ?? null;
  }),

  upsert: authedQuery.input(upsertInput).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const values = { userId, ...input, businessType: input.businessType ?? null };

    await db
      .insert(businessProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: businessProfiles.userId,
        set: { ...input, businessType: input.businessType ?? null, updatedAt: new Date() },
      });

    return db.query.businessProfiles.findFirst({
      where: eq(businessProfiles.userId, userId),
    });
  }),
});
