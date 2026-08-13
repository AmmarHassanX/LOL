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

const upsertInput = z.object({
  businessName: z.string().min(1).max(255),
  contactName: z.string().max(255).optional(),
  phone: z.string().max(40).optional(),
  businessType: businessTypeEnum.optional(),
  street: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  zip: z
    .string()
    .regex(/^\d{5}$/, "ZIP must be 5 digits")
    .optional(),
  taxId: z.string().max(64).optional(),
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

    const values = {
      userId,
      businessName: input.businessName,
      contactName: input.contactName ?? null,
      phone: input.phone ?? null,
      businessType: input.businessType ?? null,
      street: input.street ?? null,
      city: input.city ?? null,
      zip: input.zip ?? null,
      taxId: input.taxId ?? null,
    };

    await db
      .insert(businessProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: businessProfiles.userId,
        set: {
          businessName: values.businessName,
          contactName: values.contactName,
          phone: values.phone,
          businessType: values.businessType,
          street: values.street,
          city: values.city,
          zip: values.zip,
          taxId: values.taxId,
          updatedAt: new Date(),
        },
      });

    return db.query.businessProfiles.findFirst({
      where: eq(businessProfiles.userId, userId),
    });
  }),
});
