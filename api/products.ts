import { and, asc, desc, eq, gte, lte, ne, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { products, type Product } from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";
import { buildSearchCondition, buildRelevanceExpr } from "./lib/search";
import { tokenize } from "@contracts/search";
import * as salesAgent from "./lib/salesagent";

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
    const searchCondition = buildSearchCondition(input.search);
    if (searchCondition) conditions.push(searchCondition);
  }
  if (input.minPrice !== undefined)
    conditions.push(gte(products.priceCents, input.minPrice));
  if (input.maxPrice !== undefined)
    conditions.push(lte(products.priceCents, input.maxPrice));
  if (input.inStockOnly) conditions.push(ne(products.stockStatus, "out"));
  if (input.tag) {
    // Postgres jsonb containment: does the tags array contain this element?
    // (MySQL used JSON_CONTAINS — this is the Postgres equivalent.)
    conditions.push(sql`${products.tags} @> ${JSON.stringify([input.tag])}::jsonb`);
  }
  return conditions;
}

/**
 * Wraps a SalesAgent call so a network/API failure becomes a clean
 * `{ data: fallback, source: "salesagent", error }` response instead of an
 * unhandled tRPC error — the frontend can check `.error` to show a status
 * message, and `.source` to know whether it's looking at real ERP data or
 * not, without every call site repeating this try/catch.
 */
async function safeSalesAgentCall<T>(fallback: T, fn: () => Promise<T>) {
  try {
    const data = await fn();
    return { data, source: "salesagent" as const, error: undefined as string | undefined };
  } catch (err) {
    return {
      data: fallback,
      source: "salesagent" as const,
      error: err instanceof Error ? err.message : "Unknown SalesAgent error",
    };
  }
}

export const productsRouter = createRouter({
  /**
   * Real category menu pulled live from SalesAgent (GET /menu), as opposed
   * to the local seed data's category list. This is the first concrete,
   * working piece of the ERP integration — everything else it needs
   * (auth headers, base URL, error handling) lives in ./lib/salesagent.ts.
   *
   * NOT yet verified against the live API — this sandbox can't reach
   * mbwholesale.salesgenterp.com (confirmed via a direct network test).
   * Test this once deployed, where that restriction doesn't apply.
   */
  salesAgentCategories: publicQuery.query(async () => {
    const result = await safeSalesAgentCall([] as salesAgent.SalesAgentMenuCategory[], () =>
      salesAgent.getMenu(),
    );
    return { categories: result.data, source: result.source, error: result.error };
  }),

  /** Products within a category, live from SalesAgent. */
  salesAgentProductsByCategory: publicQuery
    .input(
      z.object({
        categoryId: z.union([z.number(), z.string()]),
        page: z.number().default(0),
        size: z.number().max(100).default(20),
        sort: z.string().default("id"),
        sortDirection: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ input }) => {
      const empty: salesAgent.SalesAgentProductPage = { content: [], totalElements: 0, totalPages: 0 };
      return safeSalesAgentCall(empty, () =>
        salesAgent.listProductsByCategory({
          categoryIdList: input.categoryId,
          page: input.page,
          size: input.size,
          sort: input.sort,
          sortDirection: input.sortDirection,
        }),
      );
    }),

  /** Live SalesAgent search — separate from the local `suggest`/`list`
   *  search built earlier, which ranks the LOCAL seed catalog. This one
   *  asks SalesAgent to do its own matching server-side. */
  salesAgentSearch: publicQuery
    .input(z.object({ q: z.string().min(1).max(255) }))
    .query(async ({ input }) => {
      return safeSalesAgentCall([] as salesAgent.SalesAgentProduct[], () =>
        salesAgent.searchProducts(input.q),
      );
    }),

  /** Single product + related products, live from SalesAgent. */
  salesAgentProduct: publicQuery
    .input(z.object({ id: z.union([z.number(), z.string()]) }))
    .query(async ({ input }) => {
      const [product, related] = await Promise.all([
        safeSalesAgentCall(null as salesAgent.SalesAgentProduct | null, () =>
          salesAgent.getProduct(input.id),
        ),
        safeSalesAgentCall([] as salesAgent.SalesAgentProduct[], () =>
          salesAgent.getRelatedProducts(input.id),
        ),
      ]);
      return {
        product: product.data,
        related: related.data,
        source: "salesagent" as const,
        error: product.error ?? related.error,
      };
    }),

  /** Brand list, live from SalesAgent. */
  salesAgentBrands: publicQuery.query(async () => {
    return safeSalesAgentCall([] as salesAgent.SalesAgentBrand[], () => salesAgent.listBrands());
  }),

  /** Deal tags ("Nick's Daily Deal" etc.) and the products under a given
   *  tag — real ERP-driven merchandising groupings. */
  salesAgentTags: publicQuery.query(async () => {
    return safeSalesAgentCall([] as salesAgent.SalesAgentTag[], () => salesAgent.getTagList());
  }),

  salesAgentProductsByTag: publicQuery
    .input(
      z.object({
        tagId: z.union([z.number(), z.string()]),
        page: z.number().default(0),
        size: z.number().max(50).default(10),
      }),
    )
    .query(async ({ input }) => {
      const empty: salesAgent.SalesAgentProductPage = { content: [], totalElements: 0, totalPages: 0 };
      return safeSalesAgentCall(empty, () =>
        salesAgent.getProductsByTag({ tagId: input.tagId, page: input.page, size: input.size }),
      );
    }),

  list: publicQuery
    .input(listInput.optional())
    .query(async ({ ctx, input: rawInput }) => {
      const input = listInput.parse(rawInput ?? {});
      const db = getDb();
      const where = and(...buildWhere(input));

      // When searching, rank by relevance first — an exact name match
      // should outrank a "newest" or alphabetical tiebreak. The person's
      // chosen sort still applies as a secondary tiebreaker among equally
      // relevant results (e.g. "cheapest of the good matches").
      const orderBy = input.search
        ? [desc(buildRelevanceExpr(input.search)), sortMap[input.sort]]
        : [sortMap[input.sort]];

      const [rows, [{ total }]] = await Promise.all([
        db
          .select()
          .from(products)
          .where(where)
          .orderBy(...orderBy)
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

  /**
   * Lightweight autocomplete for the navbar search dropdown. Deliberately
   * separate from `list`: small, fixed result count, and returns matching
   * brands/categories alongside products so the dropdown can offer
   * "jump straight to this brand/category" shortcuts, not just products.
   */
  suggest: publicQuery
    .input(z.object({ q: z.string().min(1).max(255) }))
    .query(async ({ ctx, input }) => {
      const words = tokenize(input.q);
      if (words.length === 0) {
        return { products: [], brands: [], categories: [] };
      }

      const db = getDb();
      const searchCondition = buildSearchCondition(input.q);
      const relevance = buildRelevanceExpr(input.q);

      const rows = await db
        .select()
        .from(products)
        .where(searchCondition)
        .orderBy(desc(relevance))
        .limit(8);

      const authed = !!ctx.user;
      const term = `%${input.q.trim()}%`;
      const [brandRows, categoryRows] = await Promise.all([
        db
          .selectDistinct({ brand: products.brand })
          .from(products)
          .where(sql`${products.brand} LIKE ${term}`)
          .limit(4),
        db
          .selectDistinct({ category: products.category })
          .from(products)
          .where(sql`${products.category} LIKE ${term}`)
          .limit(4),
      ]);

      return {
        products: rows.map((row) => gatePrice(row, authed)),
        brands: brandRows.map((b) => b.brand),
        categories: categoryRows.map((c) => c.category),
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
