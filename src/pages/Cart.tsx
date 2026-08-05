import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Lock, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuth } from '@/hooks/useAuth';
import { LOGIN_PATH } from '@/const';
import GuestGate from '@/components/checkout/GuestGate';
import {
  DELIVERY_FEE_CENTS,
  FREE_DELIVERY_CENTS,
  formatCents,
  useCartPricing,
} from '@/components/checkout/cartPricing';
import { cn } from '@/lib/utils';

const rowVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function Cart() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, setQty, removeItem, clear } = useCartStore();
  const {
    lines,
    subtotalCents,
    caseCount,
    totalCents,
    freeDelivery,
    isPricingLoading,
  } = useCartPricing();

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1100px] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-line text-stone">
            <ShoppingCart className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
            Your cart is empty
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-stone">
            Build a wholesale order by the case — delivery is statewide across Indiana.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-lg border border-amber px-6 py-3 text-sm font-semibold text-amber-deep transition-all duration-150 hover:bg-amber hover:text-paper active:scale-[0.97]"
          >
            Browse Catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Auth loading ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-paper-2" />
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[136px] animate-pulse rounded-xl border border-line bg-paper-2" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-xl border border-line bg-paper-2 lg:col-span-4" />
        </div>
      </div>
    );
  }

  // ── Guest gate ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <GuestGate
        title="Sign in to view wholesale pricing"
        description={`You have ${caseCount} case${caseCount === 1 ? '' : 's'} in your cart. Wholesale pricing and checkout are available to registered MB Wholesale customers — sign in to see your totals and place the order.`}
        note="YOUR CART IS SAVED AND WILL BE WAITING"
      />
    );
  }

  const remaining = Math.max(0, FREE_DELIVERY_CENTS - subtotalCents);
  const progress = Math.min(100, (subtotalCents / FREE_DELIVERY_CENTS) * 100);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-amber">
            {'// WHOLESALE ORDER'}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
            Your Cart
          </h1>
        </div>
        <p className="font-mono text-[11px] tracking-[0.14em] text-stone">
          {caseCount} CASE{caseCount === 1 ? '' : 'S'} · SAVED TO YOUR ACCOUNT
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        {/* ── Line items ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-stone">
              {lines.length} LINE ITEM{lines.length === 1 ? '' : 'S'}
            </span>
            <button
              type="button"
              onClick={clear}
              className="font-mono text-[11px] tracking-[0.14em] text-stone underline decoration-line underline-offset-4 transition-colors hover:text-amber-deep hover:decoration-amber"
            >
              CLEAR CART
            </button>
          </div>

          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {lines.map((line, i) => (
                <motion.li
                  key={line.productId}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-5 overflow-hidden py-6"
                >
                  <Link
                    to={`/products/${line.slug}`}
                    className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-line bg-paper-2"
                  >
                    <img
                      src={line.image ?? '/product-placeholder.jpg'}
                      alt={line.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-stone">
                      {line.brand.toUpperCase()}
                    </span>
                    <Link
                      to={`/products/${line.slug}`}
                      className="mt-1 line-clamp-2 font-display text-base font-semibold tracking-tight text-ink hover:text-amber-deep"
                    >
                      {line.name}
                    </Link>
                    <span className="mt-1 font-mono text-[11px] uppercase tracking-wide text-stone">
                      {line.caseSize}
                      {line.stockStatus === 'low' && (
                        <span className="ml-2 text-amber-deep">· LOW STOCK</span>
                      )}
                      {line.stockStatus === 'out' && (
                        <span className="ml-2 text-amber-deep">· OUT OF STOCK</span>
                      )}
                      {!line.available && (
                        <span className="ml-2 text-amber-deep">· NO LONGER AVAILABLE</span>
                      )}
                    </span>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="flex items-center rounded-lg border border-line">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${line.name}`}
                          onClick={() => setQty(line.productId, line.qty - 1)}
                          className="flex h-9 w-9 items-center justify-center text-stone transition-colors hover:text-ink"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-mono text-sm font-medium">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${line.name}`}
                          onClick={() => setQty(line.productId, line.qty + 1)}
                          className="flex h-9 w-9 items-center justify-center text-stone transition-colors hover:text-ink"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        {line.lineTotalCents != null ? (
                          <span className="font-mono text-base font-bold text-ink">
                            {formatCents(line.lineTotalCents)}
                          </span>
                        ) : (
                          <Link
                            to={LOGIN_PATH}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide text-amber-deep transition-colors hover:bg-amber hover:text-paper"
                          >
                            <Lock className="h-3 w-3" strokeWidth={2.5} />
                            SIGN IN FOR PRICE
                          </Link>
                        )}
                        <button
                          type="button"
                          aria-label={`Remove ${line.name}`}
                          onClick={() => removeItem(line.productId)}
                          className="text-stone transition-colors hover:text-amber-deep"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <Link
            to="/products"
            className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-amber-deep"
          >
            Keep shopping
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ── Order summary ──────────────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-line bg-paper p-6 lg:sticky lg:top-[150px]">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">
              Order Summary
            </h2>

            {/* Free delivery progress */}
            <div className="mt-5">
              <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
                <motion.div
                  className={cn('h-full rounded-full', freeDelivery ? 'bg-forest' : 'bg-amber')}
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {freeDelivery ? (
                  <motion.p
                    key="free"
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-forest"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    FREE DELIVERY UNLOCKED
                  </motion.p>
                ) : (
                  <motion.p
                    key="away"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2.5 font-mono text-[10px] font-bold tracking-[0.14em] text-stone"
                  >
                    {isPricingLoading ? 'CALCULATING…' : `${formatCents(remaining)} AWAY FROM FREE DELIVERY`}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <dl className="mt-6 space-y-3 border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <dt className="font-mono text-[11px] tracking-[0.14em] text-stone">SUBTOTAL</dt>
                <dd className="font-mono text-sm font-medium text-ink">
                  {isPricingLoading ? '—' : formatCents(subtotalCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-mono text-[11px] tracking-[0.14em] text-stone">CASE COUNT</dt>
                <dd className="font-mono text-sm font-medium text-ink">{caseCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-mono text-[11px] tracking-[0.14em] text-stone">
                  DELIVERY (STATEWIDE IN)
                </dt>
                <dd
                  className={cn(
                    'font-mono text-sm font-bold',
                    freeDelivery ? 'text-forest' : 'text-ink',
                  )}
                >
                  {freeDelivery ? 'FREE' : formatCents(DELIVERY_FEE_CENTS)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-4">
                <dt className="font-mono text-[11px] font-bold tracking-[0.14em] text-ink">TOTAL</dt>
                <dd className="font-display text-2xl font-bold tracking-tight text-ink">
                  {isPricingLoading ? '—' : formatCents(totalCents)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-stone">
              FREE DELIVERY OVER {formatCents(FREE_DELIVERY_CENTS)} · OTHERWISE{' '}
              {formatCents(DELIVERY_FEE_CENTS)} FLAT · INDIANA ONLY
            </p>

            <Link
              to="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-6 py-4 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
