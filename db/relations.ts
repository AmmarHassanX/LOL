import { relations } from "drizzle-orm";
import {
  users,
  products,
  orders,
  orderItems,
  businessProfiles,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  orders: many(orders),
  businessProfile: one(businessProfiles),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const businessProfilesRelations = relations(
  businessProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [businessProfiles.userId],
      references: [users.id],
    }),
  }),
);
