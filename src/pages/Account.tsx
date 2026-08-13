import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { animate, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowRight,
  BadgePercent,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Package,
  Pencil,
  Plus,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AccountShell from '@/components/account/AccountShell';
import StatusChip from '@/components/account/StatusChip';
import ProfileForm from '@/components/account/ProfileForm';
import type { ProfileFormValues } from '@/components/account/ProfileForm';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { cn } from '@/lib/utils';
import {
  BUSINESS_TYPE_LABEL,
  formatDate,
  formatDateMono,
  formatMoney,
  isOpenOrder,
  statusStep,
  toDate,
} from '@/components/account/utils';
import type { OrderSummary } from '@/components/account/utils';

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

/** Animated count-up number (0.8s on load / when target changes). */
function CountUp({ target, format }: { target: number; format: (n: number) => string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [target]);
  return <>{format(value)}</>;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      variants={staggerChild}
      className={cn(
        'rounded-xl border bg-paper p-5',
        accent ? 'border-amber/50' : 'border-line',
      )}
    >
      <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-stone">{label}</p>
      <p
        className={cn(
          'mt-2 font-mono text-3xl font-bold tracking-tight',
          accent ? 'text-amber-deep' : 'text-ink',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 font-mono text-[11px] text-stone">{sub}</p>}
    </motion.div>
  );
}

function nextDeliveryLabel(orders: OrderSummary[]): { day: string; sub: string } {
  const upcoming = orders
    .filter((o) => isOpenOrder(o.status))
    .map((o) => toDate(o.eta))
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime());
  const next = upcoming[0];
  if (!next) return { day: '—', sub: 'NO OPEN DELIVERIES' };
  return {
    day: next.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    sub: formatDateMono(next),
  };
}

function StatsRow({ orders }: { orders: OrderSummary[] }) {
  const now = new Date().getFullYear();
  const openCount = orders.filter((o) => isOpenOrder(o.status)).length;
  const ytdCents = orders
    .filter((o) => toDate(o.placedAt)?.getFullYear() === now)
    .reduce((sum, o) => sum + o.totalCents, 0);
  const next = nextDeliveryLabel(orders);

  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
    >
      <StatCard
        label="OPEN ORDERS"
        accent
        value={<CountUp target={openCount} format={(n) => String(Math.round(n))} />}
        sub="IN PROGRESS"
      />
      <StatCard
        label="TOTAL ORDERS"
        value={<CountUp target={orders.length} format={(n) => String(Math.round(n))} />}
        sub="ALL TIME"
      />
      <StatCard
        label="YTD SPEND"
        value={
          <CountUp
            target={ytdCents / 100}
            format={(n) =>
              `$${Math.round(n).toLocaleString('en-US')}`
            }
          />
        }
        sub={`${now} CALENDAR YEAR`}
      />
      <StatCard label="NEXT DELIVERY" value={next.day} sub={next.sub} />
    </motion.div>
  );
}

function ActiveShipments({ orders }: { orders: OrderSummary[] }) {
  const open = orders.filter((o) => isOpenOrder(o.status)).slice(0, 2);
  if (open.length === 0) return null;

  return (
    <section className="mt-10">
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// ACTIVE SHIPMENTS</p>
      <div className="mt-4 space-y-4">
        {open.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
            className="rounded-xl border border-line bg-paper p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-bold text-ink">{order.orderNo}</p>
                <p className="mt-0.5 font-mono text-[11px] text-stone">
                  PLACED {formatDateMono(order.placedAt)} · ETA {order.eta ?? 'TBD'}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-line font-mono text-[11px] tracking-wider"
              >
                <Link to={`/account/orders/${order.id}`}>
                  TRACK
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <OrderStatusStepper currentStep={statusStep(order.status)} className="mt-6" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function QuickReorder({ orders }: { orders: OrderSummary[] }) {
  const lastOrder = orders[0];
  const addItem = useCartStore((s) => s.addItem);
  const detailQuery = trpc.orders.byId.useQuery(
    { id: lastOrder?.id ?? 0 },
    { enabled: !!lastOrder },
  );
  const items = detailQuery.data?.items.slice(0, 3) ?? [];

  if (!lastOrder || items.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// QUICK REORDER</p>
        <p className="font-mono text-[11px] text-stone">FROM {lastOrder.orderNo}</p>
      </div>
      <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-paper">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4">
            <img
              src="/product-placeholder.jpg"
              alt=""
              className="h-11 w-11 rounded-lg border border-line bg-paper-2 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-ink">{item.name}</p>
              <p className="font-mono text-[11px] text-stone">
                {item.brand.toUpperCase()} · {item.qty} × {formatMoney(item.priceCents)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber/60 text-amber-deep hover:bg-amber-soft hover:text-amber-deep"
              onClick={() => {
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
                toast.success(`${item.name} added to cart`);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add again
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentOrders({ orders }: { orders: OrderSummary[] }) {
  const recent = orders.slice(0, 5);
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// RECENT ORDERS</p>
        <Link
          to="/account/orders"
          className="group flex items-center gap-1 font-mono text-[11px] font-bold tracking-wider text-ink hover:text-amber-deep"
        >
          VIEW ALL
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-line bg-paper-2/50 px-6 py-12 text-center">
          <Package className="h-8 w-8 text-stone" />
          <p className="mt-3 font-display text-lg font-semibold text-ink">No orders yet</p>
          <p className="mt-1 text-sm text-stone">
            Your wholesale order history will appear here.
          </p>
          <Button asChild className="mt-5 bg-amber text-paper hover:bg-amber-deep">
            <Link to="/products">Browse Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-paper">
          {recent.map((order) => (
            <Link
              key={order.id}
              to={`/account/orders/${order.id}`}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-paper-2"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold text-ink">{order.orderNo}</p>
                <p className="font-mono text-[11px] text-stone">
                  {formatDateMono(order.placedAt)} · {order.itemCount} ITEMS
                </p>
              </div>
              <p className="font-mono text-sm font-bold text-ink">
                {formatMoney(order.totalCents)}
              </p>
              <StatusChip status={order.status} />
              <ChevronRight className="h-4 w-4 shrink-0 text-stone" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function BusinessProfileSection() {
  const utils = trpc.useUtils();
  const profileQuery = trpc.profile.get.useQuery();
  const [editing, setEditing] = useState(false);

  const upsert = trpc.profile.upsert.useMutation({
    onSuccess: async () => {
      await utils.profile.get.invalidate();
      setEditing(false);
      toast.success('Business profile saved');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (values: ProfileFormValues) => upsert.mutate(values);
  const profile = profileQuery.data;

  return (
    <section id="profile" className="mt-10 scroll-mt-24">
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">
        // BUSINESS PROFILE
      </p>

      {profileQuery.isLoading ? (
        <div className="mt-4 rounded-xl border border-line bg-paper p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ) : profile === null || profile === undefined ? (
        /* ── Onboarding: no profile yet ── */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mt-4 overflow-hidden rounded-xl border border-amber/50 bg-paper"
        >
          <div className="border-b border-amber/30 bg-amber-soft px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper">
                <ClipboardCheck className="h-5 w-5 text-amber-deep" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                  Complete your business profile
                </h2>
                <p className="font-mono text-[11px] tracking-wider text-amber-deep">
                  REQUIRED FOR WHOLESALE VERIFICATION
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/80">
              Tell us about your business so we can verify your wholesale account, unlock
              delivery routing, and assign your salesman. Indiana delivery addresses only.
            </p>
          </div>
          <div className="p-6">
            <ProfileForm
              profile={null}
              onSubmit={handleSubmit}
              submitting={upsert.isPending}
              submitLabel="Submit for Verification"
            />
          </div>
        </motion.div>
      ) : editing ? (
        /* ── Editing existing profile ── */
        <motion.div
          layout="position"
          className="mt-4 rounded-xl border border-line bg-paper p-6"
        >
          <h2 className="font-display text-lg font-semibold text-ink">Edit business profile</h2>
          <div className="mt-5">
            <ProfileForm
              profile={profile}
              onSubmit={handleSubmit}
              submitting={upsert.isPending}
              submitLabel="Save Changes"
              onCancel={() => setEditing(false)}
            />
          </div>
        </motion.div>
      ) : (
        /* ── Read-only profile card ── */
        <motion.div layout="position" className="mt-4 rounded-xl border border-line bg-paper">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-soft">
                <Building2 className="h-5 w-5 text-amber-deep" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  {profile.company}
                </h2>
                <p className="font-mono text-[11px] tracking-wider text-stone">
                  {(BUSINESS_TYPE_LABEL[profile.businessType ?? ''] ?? 'BUSINESS').toUpperCase()}
                  {profile.taxId ? ` · TAX ID ${profile.taxId}` : ''}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-line"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
          <dl className="grid gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-2">
            {[
              ['CONTACT', `${profile.firstName} ${profile.lastName}`.trim() || '—'],
              ['PHONE', profile.phone ?? '—'],
              [
                'DELIVERY ADDRESS',
                profile.address1
                  ? `${profile.address1}, ${profile.city ?? ''}, ${profile.state ?? 'IN'} ${profile.zip ?? ''}`
                  : '—',
              ],
              ['TAX / RESALE ID', profile.taxId ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[10px] font-bold tracking-[0.18em] text-stone">
                  {label}
                </dt>
                <dd className="mt-1 text-[15px] text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      )}
    </section>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const ordersQuery = trpc.orders.mine.useQuery();
  const profileQuery = trpc.profile.get.useQuery();

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const firstName = profileQuery.data?.firstName ?? user?.name?.split(' ')[0] ?? 'there';
  const businessLine = profileQuery.data?.company
    ? ` · ${profileQuery.data.company.toUpperCase()}`
    : '';

  return (
    <div>
      {/* Greeting */}
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// DASHBOARD</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1.5 font-mono text-[11px] tracking-wider text-stone">
        {formatDateMono(new Date())}, {formatDate(new Date()).toUpperCase()}
        {businessLine}
      </p>

      {/* Stats */}
      <div className="mt-6">
        {ordersQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <StatsRow orders={orders} />
        )}
      </div>

      {/* Promo banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        className="mt-6 flex items-center gap-3 rounded-xl border border-amber/30 bg-amber-soft px-5 py-4"
      >
        <BadgePercent className="h-5 w-5 shrink-0 text-amber-deep" />
        <p className="text-sm text-ink">
          <span className="font-semibold">This month:</span> 5% off Barcel cases — auto-applied
          at checkout.
        </p>
      </motion.div>

      {!ordersQuery.isLoading && (
        <>
          <ActiveShipments orders={orders} />
          <QuickReorder orders={orders} />
          <RecentOrders orders={orders} />
        </>
      )}

      <BusinessProfileSection />

      {/* Delivery footprint note */}
      <div className="mt-10 flex items-center gap-3 rounded-xl border border-line bg-paper-2/60 px-5 py-4">
        <Truck className="h-5 w-5 shrink-0 text-amber-deep" />
        <p className="font-mono text-[11px] tracking-wider text-stone">
          MB WHOLESALE DELIVERS EVERYWHERE IN INDIANA — ROUTES DISPATCH FROM INDIANAPOLIS.
        </p>
      </div>
    </div>
  );
}

export default function Account() {
  return (
    <AccountShell>
      <Dashboard />
    </AccountShell>
  );
}
