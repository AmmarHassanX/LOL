import {
  pgTable,
  serial,
  bigint,
  integer,
  jsonb,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// NOTE: converted from MySQL to Postgres (see PROJECT NOTES / conversation
// for why: PlanetScale, the MySQL option, dropped its free tier and starts
// at $39/mo; Neon's free Postgres tier plugs into Vercel with one click).
// Postgres has no UNSIGNED integers (a MySQL-only concept) — the `unsigned`
// option is simply dropped below, not replaced with anything.

export type AccountStatus = "pending" | "approved" | "rejected";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  /** Only set for accounts created via the standalone email/password login
   *  added after the original Kimi-platform OAuth login was removed —
   *  real wholesale customers have no reason to have a Kimi account. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** New accounts start "pending" and can't log in until a staff member
   *  reviews their business/license info and approves them — this is a
   *  licensed tobacco/vape distributor, not a general storefront. */
  accountStatus: varchar("accountStatus", { length: 10 })
    .$type<AccountStatus>()
    .notNull()
    .default("pending"),
  accountStatusNote: text("accountStatusNote"),
  avatar: text("avatar"),
  role: varchar("role", { length: 10 }).$type<"user" | "admin">().default("user").notNull(),
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

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  specs: jsonb("specs").$type<ProductSpecs>(),
  /** Wholesale price per case, in cents. Gated behind auth at the API layer. */
  priceCents: integer("priceCents").notNull(),
  unitLabel: varchar("unitLabel", { length: 100 }),
  stockStatus: varchar("stockStatus", { length: 10 })
    .$type<StockStatus>()
    .notNull()
    .default("in"),
  image: varchar("image", { length: 512 }),
  tags: jsonb("tags").$type<ProductTag[]>(),
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

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNo: varchar("orderNo", { length: 32 }).notNull().unique(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  status: varchar("status", { length: 20 })
    .$type<OrderStatus>()
    .notNull()
    .default("placed"),
  subtotalCents: integer("subtotalCents").notNull(),
  deliveryFeeCents: integer("deliveryFeeCents").notNull().default(0),
  totalCents: integer("totalCents").notNull(),
  deliveryAddress: jsonb("deliveryAddress").$type<DeliveryAddress>().notNull(),
  placedAt: timestamp("placedAt").defaultNow().notNull(),
  eta: varchar("eta", { length: 100 }),
  notes: text("notes"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull(),
  productId: bigint("product_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }).notNull(),
  qty: integer("qty").notNull(),
  priceCents: integer("priceCents").notNull(),
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

export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .unique(),

  // ── Owner/manager (required) ──
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),

  // ── Company (required) ──
  /** Legal company name, as shown on the tax ID / license documents. */
  company: varchar("company", { length: 255 }).notNull(),
  dbaName: varchar("dbaName", { length: 255 }),
  businessType: varchar("businessType", { length: 20 }).$type<BusinessType>(),

  // ── Address (required) ──
  address1: varchar("address1", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zip: varchar("zip", { length: 10 }).notNull(),
  county: varchar("county", { length: 100 }),
  country: varchar("country", { length: 2 }).notNull().default("US"),

  // ── Tax / license IDs — taxId, feinNumber, and tobaccoId are required;
  //    the rest are optional, matching SalesAgent's own application form
  //    (a store might not carry vapor or hemp products, for instance). ──
  taxId: varchar("taxId", { length: 64 }).notNull(),
  feinNumber: varchar("feinNumber", { length: 64 }).notNull(),
  tobaccoId: varchar("tobaccoId", { length: 64 }).notNull(),
  tobaccoLicenseExpiration: timestamp("tobaccoLicenseExpiration"),
  cigaretteId: varchar("cigaretteId", { length: 64 }),
  cigaretteLicenseExpiration: timestamp("cigaretteLicenseExpiration"),
  vaporTaxId: varchar("vaporTaxId", { length: 64 }),
  vaporTaxExpiration: timestamp("vaporTaxExpiration"),
  salesTaxId: varchar("salesTaxId", { length: 64 }),
  salesTaxExpiration: timestamp("salesTaxExpiration"),
  hempLicenseNumber: varchar("hempLicenseNumber", { length: 64 }),
  hempLicenseExpiration: timestamp("hempLicenseExpiration"),
  drivingLicenseNumber: varchar("drivingLicenseNumber", { length: 64 }),
  bankName: varchar("bankName", { length: 255 }),

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

export const contactMessages = pgTable("contact_messages", {
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
