import { sql, type SQL } from "drizzle-orm";
import { products } from "@db/schema";
import { tokenize } from "@contracts/search";

/**
 * Shared search logic for the product catalog.
 *
 * Design goals (per "make search smart and powerful"):
 *  1. Multi-word queries shouldn't require exact substring order — a search
 *     for "red bull energy" should match a product named
 *     "Energy Drink – Red Bull", not just literal "red bull energy".
 *  2. Results should be RANKED by relevance, not just filtered. An exact
 *     name match should outrank a description-only mention.
 *  3. Partial words are naturally somewhat typo/incompleteness tolerant
 *     since every clause is a LIKE '%word%' — "vap" still matches "vape"/
 *     "vapes". True fuzzy (edit-distance) matching is a further step; see
 *     note in README below this file's tests.
 *
 * The tokenizer and relevance WEIGHTS are shared with contracts/search.ts,
 * which is what's actually unit-tested (see contracts/search.test.ts) —
 * this sandbox has no DATABASE_URL configured, so the SQL-building here is
 * carefully hand-verified and type-checked, but the query execution against
 * real MySQL has NOT been tested end-to-end. Treat this as reviewed-but-
 * unexercised until it's run against a real database.
 */

const SEARCHABLE_COLUMNS = [
  products.name,
  products.brand,
  products.category,
  products.subcategory,
  products.description,
] as const;

/**
 * Builds the WHERE condition: every word must match SOMEWHERE across the
 * searchable columns (AND across words, OR across columns per word). This
 * is what makes word order not matter.
 */
export function buildSearchCondition(rawQuery: string): SQL | undefined {
  const words = tokenize(rawQuery);
  if (words.length === 0) return undefined;

  const perWordClauses = words.map((word) => {
    const term = `%${word}%`;
    const columnMatches = SEARCHABLE_COLUMNS.map(
      (col) => sql`${col} LIKE ${term}`,
    );
    return sql`(${sql.join(columnMatches, sql` OR `)})`;
  });

  return sql`(${sql.join(perWordClauses, sql` AND `)})`;
}

/**
 * Builds a numeric relevance expression for ORDER BY. Higher = better
 * match. Weights, in order of importance:
 *   - Exact name match                    : 100
 *   - Name starts with the full query     :  60
 *   - Name contains the full query        :  40
 *   - Brand equals/contains the full query:  25
 *   - Category/subcategory contains query :  12
 *   - +6 per individual word found in name (rewards multi-word overlap
 *     beyond just "the query appears somewhere")
 *   - Base 0 when there's no search term, so normal sort is unaffected.
 */
export function buildRelevanceExpr(rawQuery: string): SQL<number> {
  const trimmed = rawQuery.trim();
  const words = tokenize(rawQuery);
  if (!trimmed || words.length === 0) {
    return sql<number>`0`;
  }

  const fullTerm = `%${trimmed}%`;
  const nameWordBonuses = words.map(
    (w) => sql`(CASE WHEN ${products.name} LIKE ${`%${w}%`} THEN 6 ELSE 0 END)`,
  );

  return sql<number>`(
    (CASE WHEN LOWER(${products.name}) = LOWER(${trimmed}) THEN 100 ELSE 0 END) +
    (CASE WHEN ${products.name} LIKE ${`${trimmed}%`} THEN 60 ELSE 0 END) +
    (CASE WHEN ${products.name} LIKE ${fullTerm} THEN 40 ELSE 0 END) +
    (CASE WHEN ${products.brand} LIKE ${fullTerm} THEN 25 ELSE 0 END) +
    (CASE WHEN ${products.category} LIKE ${fullTerm} OR ${products.subcategory} LIKE ${fullTerm} THEN 12 ELSE 0 END) +
    (${sql.join(nameWordBonuses, sql` + `)})
  )`;
}
