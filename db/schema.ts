import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  int,
  json,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Catalog ──────────────────────────────────────────────────────────────────

// Matches the real category menu on mbwholesalellc.com (see src/data/catalog.ts
// for the source note). Keep this list and catalog.ts's CATEGORIES in sync —
// they were previously two independent, drifting lists.
export const PRODUCT_CATEGORIES = [
  "Vape & Disposable",
  "E-Liquid",
  "Smoking Accessories",
  "Rolling Papers",
  "Lighters & Butane",
  "Drinks",
  "Toy & Candy",
  "General Merchandise",
  "Energy Supplement & Personal Care",
  "Household Supplies",
  "Automotive",
  "Restaurant Supply",
  "Clothing",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type StockStatus = "in" | "low" | "out";
export type ProductTag = "new" | "best-seller" | "promo";

export type ProductSpecs = {
  caseSize?: string;
  sku?: string;
  upc?: string;
  unitCount?: number;
};

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  specs: json("specs").$type<ProductSpecs>(),
  /** Wholesale price per case, in cents. Gated behind auth at the API layer. */
  priceCents: int("priceCents").notNull(),
  unitLabel: varchar("unitLabel", { length: 100 }),
  stockStatus: varchar("stockStatus", { length: 10 })
    .$type<StockStatus>()
    .notNull()
    .default("in"),
  image: varchar("image", { length: 512 }),
  tags: json("tags").$type<ProductTag[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "picked"
  | "out_for_delivery"
  | "delivered";

export type DeliveryAddress = {
  businessName: string;
  street: string;
  city: string;
  state: string; // always "IN" — Indiana-only delivery
  zip: string;
};

export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  orderNo: varchar("orderNo", { length: 32 }).notNull().unique(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  status: varchar("status", { length: 20 })
    .$type<OrderStatus>()
    .notNull()
    .default("placed"),
  subtotalCents: int("subtotalCents").notNull(),
  deliveryFeeCents: int("deliveryFeeCents").notNull().default(0),
  totalCents: int("totalCents").notNull(),
  deliveryAddress: json("deliveryAddress").$type<DeliveryAddress>().notNull(),
  placedAt: timestamp("placedAt").defaultNow().notNull(),
  eta: varchar("eta", { length: 100 }),
  notes: text("notes"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }).notNull(),
  qty: int("qty").notNull(),
  priceCents: int("priceCents").notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ── Business profiles ────────────────────────────────────────────────────────

export type BusinessType =
  | "c-store"
  | "gas-station"
  | "restaurant"
  | "smoke-shop"
  | "market"
  | "other";

export const businessProfiles = mysqlTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  phone: varchar("phone", { length: 40 }),
  businessType: varchar("businessType", { length: 20 }).$type<BusinessType>(),
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 100 }),
  zip: varchar("zip", { length: 10 }),
  taxId: varchar("taxId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = typeof businessProfiles.$inferInsert;

// ── Contact messages ─────────────────────────────────────────────────────────

export type ContactTopic = "general" | "sales" | "salesman" | "support";

export const contactMessages = mysqlTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  topic: varchar("topic", { length: 20 })
    .$type<ContactTopic>()
    .notNull()
    .default("general"),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;
