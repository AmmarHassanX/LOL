import { z } from "zod";
import { contactMessages } from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";

const submitInput = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(320),
  phone: z.string().max(40).optional(),
  topic: z
    .enum(["general", "sales", "salesman", "support"])
    .optional()
    .default("general"),
  message: z.string().min(1).max(5000),
});

export const contactRouter = createRouter({
  submit: publicQuery.input(submitInput).mutation(async ({ input }) => {
    const db = getDb();
    const [{ id }] = await db
      .insert(contactMessages)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        topic: input.topic,
        message: input.message,
      })
      .returning({ id: contactMessages.id });
    return { success: true, id };
  }),
});
