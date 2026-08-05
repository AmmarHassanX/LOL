import { and, asc, desc, eq, gte, lte, ne, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { products, type Product } from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";

/** Wholesale pricing is gated: guests receive priceCents as null. */
export type PublicProduct = Omit<Product, "priceCents"> & {
  priceCents: number | null;
};

function gatePrice(row: Product, authed: boolean): PublicProduct {
  return { ...row, priceCents: authed ? row.priceCents : null };
}

const sortMap = {
  "name-asc": asc(products.name),
  "name-desc": desc(products.name),
  "price-asc": asc(products.priceCents),
  "price-desc": desc(products.priceCents),
  newest: desc(products.createdAt),
} as const;

const listInput = z.object({
  category: z.string().max(100).optional(),
  brand: z.string().max(255).optional(),
  search: z.string().max(255).optional(),
  /** Price bounds in cents (wholesale per case). */
  minPrice: z.number().int().nonnegative().optional(),
  maxPrice: z.number().int().nonnegative().optional(),
  inStockOnly: z.boolean().optional(),
  tag: z.enum(["new", "best-seller", "promo"]).optional(),
  sort: z
    .enum(["name-asc", "name-desc", "price-asc", "price-desc", "newest"])
    .optional()
    .default("newest"),
  limit: z.number().int().min(1).max(100).optional().default(24),
  offset: z.number().int().nonnegative().optional().default(0),
});

function buildWhere(input: z.infer<typeof listInput>): SQL[] {
  const conditions: SQL[] = [];
  if (input.category) conditions.push(eq(products.category, input.category));
  if (input.brand) conditions.push(eq(products.brand, input.brand));
  if (input.search) {
    const term = `%${input.search}%`;
    conditions.push(
      sql`(${products.name} LIKE ${term} OR ${products.brand} LIKE ${term} OR ${products.description} LIKE ${term})`,
    );
  }
  if (input.minPrice !== undefined)
    conditions.push(gte(products.priceCents, input.minPrice));
  if (input.maxPrice !== undefined)
    conditions.push(lte(products.priceCents, input.maxPrice));
  if (input.inStockOnly) conditions.push(ne(products.stockStatus, "out"));
  if (input.tag) {
    conditions.push(sql`JSON_CONTAINS(${products.tags}, ${JSON.stringify(input.tag)})`);
  }
  return conditions;
}

export const productsRouter = createRouter({
  list: publicQuery
    .input(listInput.optional())
    .query(async ({ ctx, input: rawInput }) => {
      const input = listInput.parse(rawInput ?? {});
      const db = getDb();
      const where = and(...buildWhere(input));

      const [rows, [{ total }]] = await Promise.all([
        db
          .select()
          .from(products)
          .where(where)
          .orderBy(sortMap[input.sort])
          .limit(input.limit)
          .offset(input.offset),
        db
          .select({ total: sql<number>`count(*)` })
          .from(products)
          .where(where),
      ]);

      const authed = !!ctx.user;
      return {
        products: rows.map((row) => gatePrice(row, authed)),
        total: Number(total),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  meta: publicQuery.query(async () => {
    const db = getDb();
    const [categories, brands, [range]] = await Promise.all([
      db
        .select({
          category: products.category,
          count: sql<number>`count(*)`,
        })
        .from(products)
        .groupBy(products.category)
        .orderBy(asc(products.category)),
      db
        .select({
          brand: products.brand,
          count: sql<number>`count(*)`,
        })
        .from(products)
        .groupBy(products.brand)
        .orderBy(asc(products.brand)),
      db
        .select({
          min: sql<number>`min(${products.priceCents})`,
          max: sql<number>`max(${products.priceCents})`,
        })
        .from(products),
    ]);

    return {
      categories: categories.map((c) => ({
        category: c.category,
        count: Number(c.count),
      })),
      brands: brands.map((b) => ({ brand: b.brand, count: Number(b.count) })),
      priceRange: {
        min: range?.min != null ? Number(range.min) : 0,
        max: range?.max != null ? Number(range.max) : 0,
      },
    };
  }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string().min(1).max(255) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const product = await db.query.products.findFirst({
        where: eq(products.slug, input.slug),
      });
      if (!product) {
        return { product: null, related: [] as PublicProduct[] };
      }

      const related = await db
        .select()
        .from(products)
        .where(
          and(eq(products.category, product.category), ne(products.id, product.id)),
        )
        .orderBy(desc(products.createdAt))
        .limit(4);

      const authed = !!ctx.user;
      return {
        product: gatePrice(product, authed),
        related: related.map((row) => gatePrice(row, authed)),
      };
    }),
});
