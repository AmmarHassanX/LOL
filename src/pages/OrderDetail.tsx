import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  MapPin,
  MessageCircle,
  PackageX,
  Printer,
  Repeat,
  Truck,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AccountShell from '@/components/account/AccountShell';
import StatusChip from '@/components/account/StatusChip';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { cn } from '@/lib/utils';
import {
  formatDate,
  formatDateMono,
  formatMoney,
  formatTimestamp,
  statusLabel,
  statusStep,
  toDate,
} from '@/components/account/utils';
import type { OrderWithItems } from '@/components/account/utils';

/* ── Timeline ─────────────────────────────────────────────────────────────── */

interface TimelineEvent {
  label: string;
  at: Date;
}

function buildTimeline(order: OrderWithItems): TimelineEvent[] {
  const placed = toDate(order.placedAt) ?? new Date();
  const eta = toDate(order.eta) ?? new Date(placed.getTime() + 2 * 86400_000);
  const step = statusStep(order.status);

  const at = (base: Date, dayOffset: number, h: number, m: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const all: TimelineEvent[] = [
    { label: 'ORDER PLACED', at: placed },
    { label: 'ORDER CONFIRMED BY MB WHOLESALE', at: at(placed, 0, Math.min(placed.getHours() + 2, 23), placed.getMinutes()) },
    { label: 'ORDER PICKED AT INDIANAPOLIS WAREHOUSE', at: at(placed, 1, 9, 14) },
    { label: 'OUT FOR DELIVERY — MB ROUTE TRUCK', at: at(eta, 0, 8, 2) },
    { label: 'DELIVERED — RECEIVED AT DOCK', at: at(eta, 0, 11, 47) },
  ];

  return all.slice(0, step + 1).reverse();
}

function Timeline({ order }: { order: OrderWithItems }) {
  const events = useMemo(() => buildTimeline(order), [order]);
  return (
    <section className="print:hidden">
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// TRACKING LOG</p>
      <ol className="mt-4 rounded-xl border border-line bg-paper">
        {events.map((event, i) => (
          <motion.li
            key={event.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
            className="relative flex items-start gap-4 border-b border-line px-5 py-4 last:border-0"
          >
            {/* dot + vertical connector */}
            <span className="relative mt-1 flex shrink-0 flex-col items-center">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  i === 0 ? 'bg-amber' : 'bg-stone/50',
                )}
              />
              {i < events.length - 1 && (
                <span className="absolute top-3 h-[calc(100%+18px)] w-px bg-line" />
              )}
            </span>
            <div>
              <p className="font-mono text-[11px] font-bold tracking-wider text-stone">
                {formatTimestamp(event.at)}
              </p>
              <p className={cn('mt-0.5 font-mono text-[13px]', i === 0 ? 'text-ink' : 'text-stone')}>
                {event.label}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* ── Live status note ─────────────────────────────────────────────────────── */

function StatusNote({ order }: { order: OrderWithItems }) {
  const eta = toDate(order.eta);
  const weekday = eta ? eta.toLocaleDateString('en-US', { weekday: 'long' }) : 'delivery day';
  const notes: Record<string, string> = {
    placed: 'Order received — our team is reviewing it now.',
    confirmed: 'Confirmed — queued for picking at the Indianapolis warehouse.',
    picked: 'Picked and packed — being loaded onto the delivery truck.',
    out_for_delivery: `Your order is on its route — arriving ${weekday} between 9 AM and 1 PM.`,
    delivered: 'Delivered. Thanks for stocking with MB Wholesale.',
  };
  const active = order.status === 'out_for_delivery';
  return (
    <div className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-paper-2/60 px-4 py-3">
      <Truck className={cn('h-5 w-5 shrink-0', active ? 'text-amber-deep' : 'text-stone')} />
      <p className="text-sm text-ink">{notes[order.status] ?? notes.placed}</p>
    </div>
  );
}

/* ── Delivery card with animated route line ───────────────────────────────── */

function DeliveryCard({ order }: { order: OrderWithItems }) {
  const addr = order.deliveryAddress;
  return (
    <div className="rounded-xl border border-line bg-paper print:hidden">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <MapPin className="h-4 w-4 text-amber-deep" />
        <h2 className="font-display text-base font-semibold text-ink">Delivery</h2>
      </div>
      <div className="px-5 py-4">
        <p className="text-[15px] font-medium text-ink">{addr.businessName}</p>
        <p className="mt-1 text-sm leading-relaxed text-stone">
          {addr.street}
          <br />
          {addr.city}, {addr.state} {addr.zip}
        </p>
        <div className="mt-4 space-y-2 font-mono text-[11px] tracking-wider text-stone">
          <p>
            WINDOW: <span className="text-ink">{order.eta ? order.eta.toUpperCase() : 'TBD'} · 9 AM – 1 PM</span>
          </p>
          <p>
            DRIVER NOTE: <span className="text-ink">{order.notes ?? 'DELIVER TO RECEIVING DOCK'}</span>
          </p>
        </div>

        {/* Indiana route graphic — Indianapolis hub → destination */}
        <div className="relative mx-auto mt-5 h-44 w-32">
          <img src="/indiana-outline.svg" alt="Indiana route map" className="h-full w-full" />
          <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="50" cy="55" r="3" fill="hsl(var(--brand-accent))" />
            <motion.path
              d="M50 55 C 58 75, 42 95, 52 118"
              fill="none"
              stroke="hsl(var(--brand-accent))"
              strokeWidth="1.6"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.4 }}
            />
            <motion.circle
              cx="52"
              cy="118"
              r="3"
              fill="#16150F"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            />
          </svg>
        </div>
        <p className="mt-3 text-center font-mono text-[10px] tracking-[0.14em] text-stone">
          INDIANAPOLIS HUB → {addr.city.toUpperCase()}, IN
        </p>
      </div>
    </div>
  );
}

/* ── Items card ───────────────────────────────────────────────────────────── */

function ItemsCard({ order }: { order: OrderWithItems }) {
  return (
    <div className="rounded-xl border border-line bg-paper print:hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-display text-base font-semibold text-ink">Items</h2>
      </div>
      <div className="divide-y divide-line">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
            <img
              src="/product-placeholder.jpg"
              alt=""
              className="h-12 w-12 rounded-lg border border-line bg-paper-2 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-ink">{item.name}</p>
              <p className="font-mono text-[11px] text-stone">{item.brand.toUpperCase()}</p>
            </div>
            <p className="font-mono text-[13px] whitespace-nowrap text-stone">
              {item.qty} × {formatMoney(item.priceCents)}
            </p>
            <p className="w-20 text-right font-mono text-sm font-bold whitespace-nowrap text-ink">
              {formatMoney(item.qty * item.priceCents)}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 border-t border-line px-5 py-4">
        <div className="flex justify-between font-mono text-[13px] text-stone">
          <span>SUBTOTAL</span>
          <span>{formatMoney(order.subtotalCents)}</span>
        </div>
        <div className="flex justify-between font-mono text-[13px] text-stone">
          <span>DELIVERY</span>
          <span>{order.deliveryFeeCents === 0 ? 'FREE' : formatMoney(order.deliveryFeeCents)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-2 font-mono text-base font-bold text-ink">
          <span>TOTAL</span>
          <span>{formatMoney(order.totalCents)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Invoice-style printable summary (wholesale terminal aesthetic) ───────── */

function InvoiceSummary({ order }: { order: OrderWithItems }) {
  const addr = order.deliveryAddress;
  return (
    <section className="mt-10 print:mt-0">
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber print:hidden">
        // INVOICE SUMMARY
      </p>
      <div className="mt-4 rounded-xl border border-line bg-paper p-6 font-mono text-[13px] print:mt-0 print:rounded-none print:border-0 print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <p className="text-lg font-bold tracking-tight text-ink">MB WHOLESALE LLC</p>
            <p className="mt-1 text-[11px] text-stone">
              4414 W 30TH ST, INDIANAPOLIS, IN 46222
              <br />
              (317) 555-0142 · SALES@MBWHOLESALE.COM
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] tracking-[0.18em] text-stone">WHOLESALE INVOICE</p>
            <p className="mt-1 text-base font-bold text-ink">{order.orderNo}</p>
            <p className="mt-1 text-[11px] text-stone">
              PLACED {formatDateMono(order.placedAt)} · {formatDate(order.placedAt).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-b border-line py-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-stone">DELIVER TO</p>
            <p className="mt-1.5 text-ink">{addr.businessName}</p>
            <p className="text-stone">
              {addr.street}, {addr.city}, {addr.state} {addr.zip}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-bold tracking-[0.18em] text-stone">STATUS / TERMS</p>
            <p className="mt-1.5 text-ink">{statusLabel(order.status)}</p>
            <p className="text-stone">NET DUE ON DELIVERY · ETA {order.eta?.toUpperCase() ?? 'TBD'}</p>
          </div>
        </div>

        <table className="mt-4 w-full">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-bold tracking-[0.18em] text-stone">
              <th className="py-2 pr-4">ITEM</th>
              <th className="py-2 pr-4 text-right">QTY</th>
              <th className="py-2 pr-4 text-right">CASE PRICE</th>
              <th className="py-2 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-line/60">
                <td className="py-2 pr-4 text-ink">
                  {item.name}
                  <span className="ml-2 text-[10px] text-stone">{item.brand.toUpperCase()}</span>
                </td>
                <td className="py-2 pr-4 text-right text-stone">{item.qty}</td>
                <td className="py-2 pr-4 text-right text-stone">{formatMoney(item.priceCents)}</td>
                <td className="py-2 text-right text-ink">{formatMoney(item.qty * item.priceCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-56 space-y-1.5">
          <div className="flex justify-between text-stone">
            <span>SUBTOTAL</span>
            <span>{formatMoney(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-stone">
            <span>DELIVERY</span>
            <span>{order.deliveryFeeCents === 0 ? 'FREE' : formatMoney(order.deliveryFeeCents)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-bold text-ink">
            <span>TOTAL</span>
            <span>{formatMoney(order.totalCents)}</span>
          </div>
        </div>

        <p className="mt-6 border-t border-line pt-4 text-center text-[10px] tracking-[0.18em] text-stone">
          QUALITY SERVICE. QUALITY PRODUCTS. QUALITY PRICES. — DELIVERING EVERYWHERE IN INDIANA
        </p>
      </div>
    </section>
  );
}

/* ── Route map band ───────────────────────────────────────────────────────── */

function RouteMapBand({ order }: { order: OrderWithItems }) {
  return (
    <div className="relative mt-10 overflow-hidden rounded-xl border border-line print:hidden">
      <img
        src="/map-indiana.jpg"
        alt="MB Wholesale Indiana delivery route map"
        className="h-44 w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/70 via-ink/10 to-transparent">
        <p className="flex w-full items-center gap-2 px-5 py-4 font-mono text-[11px] font-bold tracking-[0.16em] text-paper">
          <Truck className="h-4 w-4 text-amber" />
          ROUTE MAP — INDIANAPOLIS HUB → {order.deliveryAddress.city.toUpperCase()}, INDIANA ·
          DELIVERING EVERYWHERE IN INDIANA
        </p>
      </div>
    </div>
  );
}

/* ── Page body ────────────────────────────────────────────────────────────── */

function Detail() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const valid = Number.isInteger(orderId) && orderId > 0;
  const orderQuery = trpc.orders.byId.useQuery({ id: orderId }, { enabled: valid, retry: false });
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!valid || orderQuery.isError || !orderQuery.data) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-paper-2/50 px-6 py-20 text-center">
        <PackageX className="h-10 w-10 text-stone" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Order not found</h1>
        <p className="mt-2 max-w-sm text-sm text-stone">
          We couldn't find that order on your account. Check the order number and try again.
        </p>
        <Button asChild className="mt-6 bg-amber text-paper hover:bg-amber-deep">
          <Link to="/account/orders">Back to Order History</Link>
        </Button>
      </div>
    );
  }

  const order = orderQuery.data;
  const step = statusStep(order.status);

  const reorder = () => {
    for (const item of order.items) {
      addItem(
        {
          productId: String(item.productId),
          slug: `product-${item.productId}`,
          name: item.name,
          brand: item.brand,
          image: '/product-placeholder.jpg',
          casePrice: item.priceCents / 100,
          caseSize: 'Case',
        },
        item.qty,
      );
    }
    toast.success(`${order.items.length} items added to cart`);
    openDrawer();
  };

  return (
    <div>
      {/* Header */}
      <div className="print:hidden">
        <Link
          to="/account/orders"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-stone hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          ALL ORDERS
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            ORDER {order.orderNo}
          </h1>
          <StatusChip status={order.status} />
        </div>
        <p className="mt-2 font-mono text-[11px] tracking-wider text-stone">
          PLACED {formatDateMono(order.placedAt)}, {formatDate(order.placedAt).toUpperCase()} · ETA{' '}
          {order.eta?.toUpperCase() ?? 'TBD'}
        </p>
      </div>

      {/* Stepper */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mt-8 rounded-xl border border-line bg-paper p-6 print:hidden"
      >
        <OrderStatusStepper currentStep={step} />
        <StatusNote order={order} />
      </motion.section>

      {/* Items + delivery */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ItemsCard order={order} />
        <DeliveryCard order={order} />
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-3 print:hidden">
        <Button
          variant="outline"
          className="border-line"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Print / Save Invoice (PDF)
          <Download className="h-4 w-4 text-stone" />
        </Button>
        <Button className="bg-amber text-paper hover:bg-amber-deep" onClick={reorder}>
          <Repeat className="h-4 w-4" />
          Reorder
        </Button>
        <Button asChild variant="outline" className="border-line">
          <Link to="/contact">
            <MessageCircle className="h-4 w-4" />
            Need help? Contact us
          </Link>
        </Button>
      </div>

      {/* Timeline */}
      <div className="mt-10">
        <Timeline order={order} />
      </div>

      <RouteMapBand order={order} />

      <InvoiceSummary order={order} />
    </div>
  );
}

export default function OrderDetail() {
  return (
    <AccountShell>
      <Detail />
    </AccountShell>
  );
}
