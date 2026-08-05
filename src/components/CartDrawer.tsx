import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Lock, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCartStore } from '@/store/cart';
import { LOGIN_PATH } from '@/const';
import { useAuth } from '@/hooks/useAuth';
import { formatCents, useCartPricing } from '@/components/checkout/cartPricing';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

/**
 * Global slide-over cart drawer (right side, 420px).
 * Desktop: when an item is added from anywhere, the drawer peeks open for
 * 1.8s and closes if the user doesn't interact with it.
 */
export default function CartDrawer() {
  const { items, isDrawerOpen, setDrawerOpen, setQty, removeItem } = useCartStore();
  const { lines, subtotalCents, caseCount } = useCartPricing();
  const { isAuthenticated } = useAuth();
  const peekTimer = useRef<number | null>(null);

  // Auto-open peek on add-to-cart (desktop only), auto-close after 1.8s idle.
  useEffect(() => {
    const clearTimer = () => {
      if (peekTimer.current != null) {
        window.clearTimeout(peekTimer.current);
        peekTimer.current = null;
      }
    };
    const unsubscribe = useCartStore.subscribe((state, prev) => {
      const prevCount = prev.items.reduce((n, i) => n + i.qty, 0);
      const nextCount = state.items.reduce((n, i) => n + i.qty, 0);
      if (nextCount <= prevCount || state.isDrawerOpen) return;
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      clearTimer();
      peekTimer.current = window.setTimeout(() => {
        useCartStore.getState().closeDrawer();
        peekTimer.current = null;
      }, 1800);
    });
    return () => {
      clearTimer();
      unsubscribe();
    };
  }, []);

  const cancelPeek = () => {
    if (peekTimer.current != null) {
      window.clearTimeout(peekTimer.current);
      peekTimer.current = null;
    }
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        className="flex w-full flex-col border-line bg-paper p-0 sm:max-w-[420px]"
        onPointerDownCapture={cancelPeek}
        onFocusCapture={cancelPeek}
      >
        <SheetHeader className="border-b border-line px-6 py-5">
          <SheetTitle className="font-display text-xl font-bold tracking-tight text-ink">
            Your Cart
          </SheetTitle>
          <SheetDescription className="font-mono text-[11px] font-bold tracking-[0.14em] text-stone">
            {items.length === 0
              ? '0 ITEMS'
              : `${caseCount} ITEM${caseCount === 1 ? '' : 'S'} · WHOLESALE BY THE CASE`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line text-stone">
              <ShoppingCart className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <p className="font-display text-base font-semibold text-ink">Your cart is empty</p>
            <p className="-mt-2 text-sm text-stone">Browse the catalog to build an order.</p>
            <Link
              to="/products"
              onClick={() => setDrawerOpen(false)}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber px-5 py-3 text-sm font-semibold text-amber-deep transition-all duration-150 hover:bg-amber hover:text-paper active:scale-[0.97]"
            >
              Browse Catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="flex-1 divide-y divide-line overflow-y-auto px-6"
              data-lenis-prevent
            >
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li
                    key={line.productId}
                    variants={itemVariants}
                    exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-4 overflow-hidden py-4"
                  >
                    <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-line bg-paper-2">
                      <img
                        src={line.image ?? '/product-placeholder.jpg'}
                        alt={line.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-mono text-[10px] tracking-[0.14em] text-stone">
                        {line.brand.toUpperCase()}
                      </span>
                      <Link
                        to={`/products/${line.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="line-clamp-1 font-display text-sm font-semibold tracking-tight text-ink hover:text-amber-deep"
                      >
                        {line.name}
                      </Link>
                      <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-stone">
                        {line.caseSize}
                      </span>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-lg border border-line">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${line.name}`}
                            onClick={() => setQty(line.productId, line.qty - 1)}
                            className="flex h-7 w-7 items-center justify-center text-stone transition-colors hover:text-ink"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono text-xs font-medium">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${line.name}`}
                            onClick={() => setQty(line.productId, line.qty + 1)}
                            className="flex h-7 w-7 items-center justify-center text-stone transition-colors hover:text-ink"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {isAuthenticated && line.lineTotalCents != null ? (
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={line.lineTotalCents}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                                className="font-mono text-sm font-bold text-ink"
                              >
                                {formatCents(line.lineTotalCents)}
                              </motion.span>
                            </AnimatePresence>
                          ) : (
                            <Link
                              to={LOGIN_PATH}
                              onClick={() => setDrawerOpen(false)}
                              title="Wholesale pricing is available to registered customers."
                              className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-amber-deep transition-colors hover:bg-amber hover:text-paper"
                            >
                              <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                              SIGN IN
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
            </motion.ul>

            <div className="border-t border-line px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-stone">
                  SUBTOTAL
                </span>
                {isAuthenticated ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={subtotalCents}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="font-mono text-base font-bold text-ink"
                    >
                      {formatCents(subtotalCents)}
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <Link
                    to={LOGIN_PATH}
                    onClick={() => setDrawerOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide text-amber-deep transition-colors hover:bg-amber hover:text-paper"
                  >
                    <Lock className="h-3 w-3" strokeWidth={2.5} />
                    SIGN IN FOR PRICING
                  </Link>
                )}
              </div>
              <p className="mt-2 font-mono text-[10px] font-bold tracking-[0.14em] text-amber-deep">
                DELIVERY STATEWIDE IN INDIANA — CALCULATED AT CHECKOUT
              </p>
              {isAuthenticated ? (
                <Link
                  to="/checkout"
                  onClick={() => setDrawerOpen(false)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
                >
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to={LOGIN_PATH}
                  onClick={() => setDrawerOpen(false)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
                >
                  <Lock className="h-4 w-4" />
                  Sign in to Checkout
                </Link>
              )}
              <Link
                to="/cart"
                onClick={() => setDrawerOpen(false)}
                className="mt-2.5 flex w-full items-center justify-center rounded-lg border border-line px-6 py-3 text-sm font-semibold text-ink transition-all duration-150 hover:border-ink active:scale-[0.97]"
              >
                View Cart
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
