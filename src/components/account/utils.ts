import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../api/router';

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type OrderSummary = RouterOutputs['orders']['mine'][number];
export type OrderWithItems = RouterOutputs['orders']['byId'];
export type BusinessProfile = NonNullable<RouterOutputs['profile']['get']>;

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'picked',
  'out_for_delivery',
  'delivered',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** 0-based index into the 5-step status flow. Unknown statuses map to 0. */
export function statusStep(status: string): number {
  const i = ORDER_STATUSES.indexOf(status as OrderStatus);
  return i < 0 ? 0 : i;
}

export function isOpenOrder(status: string): boolean {
  return status !== 'delivered';
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'PLACED',
  confirmed: 'CONFIRMED',
  picked: 'PICKED',
  out_for_delivery: 'OUT FOR DELIVERY',
  delivered: 'DELIVERED',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status as OrderStatus] ?? status.toUpperCase();
}

export const BUSINESS_TYPE_LABEL: Record<string, string> = {
  'c-store': 'Convenience Store',
  'gas-station': 'Gas Station',
  restaurant: 'Restaurant',
  'smoke-shop': 'Smoke Shop',
  market: 'Market / Grocery',
  other: 'Other',
};

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Jun 9, 2026" */
export function formatDate(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "MON, JUN 9" — mono terminal style */
export function formatDateMono(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return d
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();
}

/** "JUN 10 14:22" — timestamp style for the tracking timeline */
export function formatTimestamp(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  const date = d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}

export { toDate };
