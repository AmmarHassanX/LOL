/**
 * Pure search-relevance scoring — no DB, no network, framework-free.
 *
 * This mirrors the weighting used in api/lib/search.ts's SQL relevance
 * expression, so the two should be kept in sync if the weights change.
 * It exists as a *separate* pure function (rather than only living in the
 * SQL builder) for two reasons:
 *   1. It's directly unit-testable (see search.test.ts) without a live
 *      database — the SQL version can only be type-checked, not executed,
 *      in an environment with no DATABASE_URL configured.
 *   2. The frontend autocomplete dropdown reuses this exact function to
 *      instantly re-rank the small result set client-side as the person
 *      types, for a snappier feel between debounced server round-trips.
 */

export function tokenize(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0),
    ),
  );
}

export type Searchable = {
  name: string;
  brand: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
};

/**
 * Scores how well `item` matches `rawQuery`. Higher is more relevant.
 * Returns 0 for an empty query or no match at all.
 */
export function scoreMatch(item: Searchable, rawQuery: string): number {
  const trimmed = rawQuery.trim();
  const words = tokenize(rawQuery);
  if (!trimmed || words.length === 0) return 0;

  const name = item.name.toLowerCase();
  const brand = item.brand.toLowerCase();
  const category = item.category.toLowerCase();
  const subcategory = (item.subcategory ?? "").toLowerCase();
  const description = (item.description ?? "").toLowerCase();
  const q = trimmed.toLowerCase();

  let score = 0;
  if (name === q) score += 100;
  if (name.startsWith(q)) score += 60;
  if (name.includes(q)) score += 40;
  if (brand.includes(q)) score += 25;
  if (category.includes(q) || subcategory.includes(q)) score += 12;
  for (const w of words) {
    if (name.includes(w)) score += 6;
  }

  // A query that matches nothing but happens to appear in the long-form
  // description still counts for *something*, just least of all — this is
  // what keeps "no results" rare without letting description-only matches
  // outrank real name/brand matches.
  if (score === 0 && description.includes(q)) score += 3;

  return score;
}

/** Sorts a list of items by relevance to `query`, best match first. Items
 *  that score 0 (no match at all) are dropped. */
export function rankByRelevance<T extends Searchable>(
  items: T[],
  query: string,
): (T & { _score: number })[] {
  return items
    .map((item) => ({ ...item, _score: scoreMatch(item, query) }))
    .filter((item) => item._score > 0)
    .sort((a, b) => b._score - a._score);
}
