import { useMemo } from 'react';
import { trpc } from '@/providers/trpc';
import { useCartStore, type CartItem } from '@/store/cart';

/** Free statewide Indiana delivery at/above $500 subtotal, else a flat $25 fee. */
export const FREE_DELIVERY_CENTS = 50000;
export const DELIVERY_FEE_CENTS = 2500;

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export interface PricedLine extends CartItem {
  /** Numeric DB product id (resolved via slug), needed by orders.create */
  dbId: number | null;
  /** Current server-side wholesale price per case in cents; null = locked (guest) / unresolved */
  priceCents: number | null;
  stockStatus: 'in' | 'low' | 'out' | null;
  /** Whether the product still exists in the live catalog */
  available: boolean;
  lineTotalCents: number | null;
}

/**
 * Resolves cart items against live tRPC catalog data.
 * Prices are NEVER trusted from the persisted cart store — they always come
 * from the server (`priceCents` is null for guests, gated at the API layer).
 */
export function useCartPricing() {
  const items = useCartStore((s) => s.items);
  const hasItems = items.length > 0;

  // Catalog seed is >= 48 products; the API caps `limit` at 100 which covers it.
  const query = trpc.products.list.useQuery(
    { limit: 100, sort: 'newest' },
    { enabled: hasItems, staleTime: 30_000, refetchOnWindowFocus: false },
  );

  const lines = useMemo<PricedLine[]>(() => {
    const bySlug = new Map((query.data?.products ?? []).map((p) => [p.slug, p]));
    return items.map((item) => {
      const product = bySlug.get(item.slug);
      const fallbackId = /^\d+$/.test(item.productId) ? Number(item.productId) : null;
      const priceCents = product?.priceCents ?? null;
      return {
        ...item,
        dbId: product?.id ?? fallbackId,
        priceCents,
        stockStatus: product?.stockStatus ?? null,
        available: !!product,
        lineTotalCents: priceCents != null ? priceCents * item.qty : null,
      };
    });
  }, [items, query.data]);

  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + (l.lineTotalCents ?? 0), 0),
    [lines],
  );
  const caseCount = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const hasUnpriced = lines.some((l) => l.priceCents == null);
  const hasUnavailable = lines.some((l) => !l.available);
  const freeDelivery = subtotalCents >= FREE_DELIVERY_CENTS;
  const deliveryFeeCents = freeDelivery ? 0 : DELIVERY_FEE_CENTS;
  const totalCents = subtotalCents + deliveryFeeCents;

  return {
    lines,
    subtotalCents,
    caseCount,
    deliveryFeeCents,
    totalCents,
    freeDelivery,
    hasUnpriced,
    hasUnavailable,
    isPricingLoading: hasItems && query.isLoading,
  };
}
