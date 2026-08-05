import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../api/router';
import { CATEGORIES, type FeaturedProduct, type StockStatus } from '@/data/catalog';

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type CatalogProduct = RouterOutputs['products']['list']['products'][number];
export type CatalogMeta = RouterOutputs['products']['meta'];

export type SortValue = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest';
export type TagValue = 'new' | 'best-seller' | 'promo';

export const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
];

export const TAG_OPTIONS: Array<{ value: TagValue; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'best-seller', label: 'Best Seller' },
  { value: 'promo', label: 'Promotion' },
];

export const STOCK_STYLES: Record<StockStatus, string> = {
  in: 'bg-forest/10 text-forest',
  low: 'bg-amber-soft text-amber-deep',
  out: 'bg-stone/10 text-stone',
};

/** Accepts either a category slug (`vapes`) or a display name (`Vapes`). */
export function categorySlugToName(slugOrName: string): string | undefined {
  const bySlug = CATEGORIES.find((c) => c.slug === slugOrName);
  if (bySlug) return bySlug.name;
  const needle = slugOrName.toLowerCase();
  return CATEGORIES.find((c) => c.name.toLowerCase() === needle)?.name;
}

export function categoryNameToSlug(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.slug ?? name;
}

/** Maps a tRPC catalog product to the shared ProductCard shape. */
export function toCardProduct(p: CatalogProduct): FeaturedProduct {
  return {
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: categoryNameToSlug(p.category),
    casePrice: p.priceCents != null ? p.priceCents / 100 : 0,
    caseSize: p.specs?.caseSize ?? p.unitLabel ?? 'Case',
    stock: p.stockStatus,
    image: p.image ?? undefined,
    tags: p.tags ?? [],
  };
}

export const dollarsToCents = (d: number) => Math.round(d * 100);
export const centsToDollars = (c: number) => c / 100;

export const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];
