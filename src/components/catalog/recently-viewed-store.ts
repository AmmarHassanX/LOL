import type { StockStatus } from '@/data/catalog';

const STORAGE_KEY = 'mb-recently-viewed';
const EVENT = 'mb-recently-viewed-changed';
const MAX_ITEMS = 8;

export interface RecentItem {
  slug: string;
  name: string;
  brand: string;
  image: string;
  /** Dollars per case; null when viewed as a guest (price unknown). */
  casePrice: number | null;
  caseSize: string;
  stock: StockStatus;
}

export const RECENTLY_VIEWED_EVENT = EVENT;

export function readRecentlyViewed(): RecentItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as RecentItem[]) : [];
  } catch {
    return [];
  }
}

/** Record a product view (called from the product detail page). */
export function pushRecentlyViewed(item: RecentItem) {
  try {
    const next = [item, ...readRecentlyViewed().filter((i) => i.slug !== item.slug)].slice(
      0,
      MAX_ITEMS,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // localStorage unavailable — skip silently
  }
}
