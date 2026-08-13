import { authRouter } from "./auth-router";
import { adminRouter } from "./admin";
import { contactRouter } from "./contact";
import { createRouter, publicQuery } from "./middleware";
import { ordersRouter } from "./orders";
import { productsRouter } from "./products";
import { profileRouter } from "./profile";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  admin: adminRouter,
  products: productsRouter,
  orders: ordersRouter,
  profile: profileRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
