import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { businessProfiles, users } from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, adminQuery } from "./middleware";

/**
 * Wholesale account review — closes the loop on the registration flow in
 * auth-router.ts. New accounts land in `users.accountStatus = "pending"`
 * and can't log in; a staff member (role === "admin") reviews the
 * submitted business/license info here and approves or rejects.
 *
 * There's no UI page wired to this yet (see conversation notes) — these
 * endpoints exist and are ready to use, e.g. from a /admin page, once
 * that's built. In the meantime the very first admin account has to be
 * promoted directly in the database (set role = 'admin' on a users row)
 * since there's no signup path that grants admin by itself.
 */
export const adminRouter = createRouter({
  pendingApplications: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({ user: users, profile: businessProfiles })
      .from(users)
      .innerJoin(businessProfiles, eq(businessProfiles.userId, users.id))
      .where(eq(users.accountStatus, "pending"))
      .orderBy(desc(users.createdAt));
    return rows;
  }),

  approve: adminQuery
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await getDb()
        .update(users)
        .set({ accountStatus: "approved", accountStatusNote: null })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  reject: adminQuery
    .input(z.object({ userId: z.number(), note: z.string().max(500).optional() }))
    .mutation(async ({ input }) => {
      await getDb()
        .update(users)
        .set({ accountStatus: "rejected", accountStatusNote: input.note ?? null })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),
});
