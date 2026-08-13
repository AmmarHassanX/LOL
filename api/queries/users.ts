import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

/** Standalone accounts use their lowercased email as unionId — see
 *  api/auth-router.ts for why. */
export const findUserByEmail = findUserByUnionId;

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
    // An owner account promoted to admin can't sensibly be left "pending"
    // — there's no other admin yet to approve them, so they'd be locked
    // out of their own site. Auto-approve alongside the role promotion.
    values.accountStatus = "approved";
    updateSet.accountStatus = "approved";
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onConflictDoUpdate({ target: schema.users.unionId, set: updateSet });
}
