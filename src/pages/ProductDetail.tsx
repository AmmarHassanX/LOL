import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import PriceLock from '@/components/PriceLock';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/catalog/RecentlyViewed';
import { pushRecentlyViewed } from '@/components/catalog/recently-viewed-store';
import {
  EASE_OUT,
  STOCK_STYLES,
  categoryNameToSlug,
  toCardProduct,
} from '@/components/catalog/catalog-utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/providers/trpc';
import { STOCK_LABEL, WAREHOUSE } from '@/data/catalog';
import { LOGIN_PATH } from '@/const';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';

type TabId = 'specs' | 'description' | 'delivery';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'specs', label: 'Specifications' },
  { id: 'description', label: 'Description' },
  { id: 'delivery', label: 'Delivery & Returns' },
];

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const { data, isLoading, isError } = trpc.products.bySlug.useQuery(
    { slug: slug ?? '' },
    { enabled: !!slug },
  );
  const product = data?.product ?? null;
  const related = data?.related ?? [];

  const [activeImg, setActiveImg] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<TabId>('specs');
  const [zipOpen, setZipOpen] = useState(false);
  const [zip, setZip] = useState('');
  const [zipResult, setZipResult] = useState<'in' | 'out' | null>(null);

  // Reset view state + scroll when navigating between products.
  useEffect(() => {
    setActiveImg(0);
    setQty(1);
    setAdded(false);
    setTab('specs');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  const gallery = useMemo(() => {
    const src = product?.image ?? '/product-placeholder.jpg';
    // Single catalog shot — present alternate crops as the thumbnail rail.
    return [
      { src, pos: 'center' },
      { src, pos: 'top' },
      { src, pos: 'bottom' },
      { src, pos: 'left' },
    ];
  }, [product?.image]);

  const caseSize = product?.specs?.caseSize ?? product?.unitLabel ?? 'Case';
  const isPromo = product?.tags?.includes('promo') ?? false;

  // Track recently viewed.
  useEffect(() => {
    if (!product) return;
    pushRecentlyViewed({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.image ?? '/product-placeholder.jpg',
      casePrice: isAuthenticated && product.priceCents != null ? product.priceCents / 100 : null,
      caseSize,
      stock: product.stockStatus,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug, isAuthenticated]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-12 lg:py-24">
        <Skeleton className="h-4 w-64 bg-paper-2" />
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Skeleton className="aspect-[4/3] w-full rounded-[20px] bg-paper-2" />
            <div className="mt-4 flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-lg bg-paper-2" />
              ))}
            </div>
          </div>
          <div className="space-y-4 lg:col-span-5">
            <Skeleton className="h-4 w-32 bg-paper-2" />
            <Skeleton className="h-10 w-full bg-paper-2" />
            <Skeleton className="h-6 w-48 bg-paper-2" />
            <Skeleton className="h-12 w-40 bg-paper-2" />
            <Skeleton className="h-12 w-full bg-paper-2" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not found / error ──────────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1280px] flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-mono text-3xl font-bold tracking-[0.18em] text-ink">
          PRODUCT NOT FOUND
        </p>
        <p className="mt-3 max-w-sm text-[15px] text-stone">
          This item may have been removed from the catalog, or the link is stale.
        </p>
        <Link
          to="/products"
          className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-3 font-semibold text-paper transition-colors hover:bg-amber-deep"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to catalog
        </Link>
      </div>
    );
  }

  const priceDollars = product.priceCents != null ? product.priceCents / 100 : 0;
  const unitCount = product.specs?.unitCount;
  const unitPrice =
    isAuthenticated && product.priceCents != null && unitCount && unitCount > 0
      ? product.priceCents / 100 / unitCount
      : null;
  const msrp = isPromo && product.priceCents != null ? (product.priceCents / 100) * 1.28 : null;
  const outOfStock = product.stockStatus === 'out';

  const handleAdd = () => {
    if (!isAuthenticated || outOfStock) return;
    addItem(
      {
        productId: String(product.id),
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: product.image ?? '/product-placeholder.jpg',
        casePrice: priceDollars,
        caseSize,
      },
      qty,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
    window.setTimeout(() => openDrawer(), 650);
  };

  const handleZipCheck = () => {
    const clean = zip.trim();
    setZipResult(/^4[6-7]\d{3}$/.test(clean) ? 'in' : 'out');
  };

  const specRows: Array<[string, string]> = [
    ['SKU', product.specs?.sku ?? `MB-${String(product.id).padStart(4, '0')}`],
    ['UPC', product.specs?.upc ?? '—'],
    ['BRAND', product.brand],
    [
      'CATEGORY',
      product.subcategory ? `${product.category} / ${product.subcategory}` : product.category,
    ],
    ['CASE SIZE', caseSize],
    ['UNIT COUNT', unitCount != null ? String(unitCount) : '—'],
    ['CASE WEIGHT', unitCount != null ? `${(unitCount * 0.6 + 3).toFixed(1)} lbs` : '—'],
    ['PALLET QTY', '80 cases'],
    ['ORIGIN', 'Indianapolis, IN'],
  ];

  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-[1280px] px-6 pt-10 lg:px-12 lg:pt-24">
        {/* ── Section 1: Breadcrumb + back ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <nav aria-label="Breadcrumb" className="font-mono text-[11px] tracking-wide text-stone">
            <Link to="/products" className="transition-colors hover:text-amber-deep">
              CATALOG
            </Link>
            <span className="mx-2">/</span>
            <Link
              to={`/products?category=${categoryNameToSlug(product.category)}`}
              className="transition-colors hover:text-amber-deep"
            >
              {product.category.toUpperCase()}
            </Link>
            {product.subcategory && (
              <>
                <span className="mx-2">/</span>
                <span className="text-ink">{product.subcategory.toUpperCase()}</span>
              </>
            )}
          </nav>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-stone transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to catalog
          </button>
        </motion.div>

        {/* ── Section 2: Product hero ──────────────────────────────────────── */}
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 0.8, ease: EASE_OUT }}
              className="group relative aspect-[4/3] overflow-hidden rounded-[20px] border border-line bg-paper-2"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setZoomOrigin(
                  `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
                );
              }}
            >
              <img
                src={gallery[activeImg]?.src}
                alt={product.name}
                style={{ transformOrigin: zoomOrigin, objectPosition: gallery[activeImg]?.pos }}
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.08]"
              />
              <span
                className={cn(
                  'absolute left-4 top-4 rounded-full px-3 py-1.5 font-mono text-[11px] font-medium tracking-wider',
                  STOCK_STYLES[product.stockStatus],
                )}
              >
                {STOCK_LABEL[product.stockStatus]}
              </span>
              {isPromo && (
                <span className="absolute right-4 top-4 rounded-full bg-amber px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider text-paper">
                  PROMOTION
                </span>
              )}
            </motion.div>

            {/* Thumbnail rail */}
            <div className="mt-4 flex gap-3">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={`View ${i + 1}`}
                  aria-pressed={activeImg === i}
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors',
                    activeImg === i ? 'border-amber' : 'border-line hover:border-stone',
                  )}
                >
                  <img
                    src={g.src}
                    alt=""
                    style={{ objectPosition: g.pos }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info column */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="lg:col-span-5"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.5, ease: EASE_OUT }}>
              <p className="font-mono text-xs font-bold tracking-[0.18em] text-stone">
                {product.brand.toUpperCase()}
              </p>
              <p className="mt-1.5 font-mono text-[11px] tracking-wide text-stone">
                SKU {product.specs?.sku ?? `MB-${String(product.id).padStart(4, '0')}`}
                {product.specs?.upc ? ` · UPC ${product.specs.upc}` : ''}
              </p>
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mt-3 font-display text-[28px] font-bold leading-[1.05] tracking-[-0.025em] text-ink md:text-[40px]"
            >
              {product.name}
            </motion.h1>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              <Link
                to={`/products?category=${categoryNameToSlug(product.category)}`}
                className="rounded-full border border-line bg-paper px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-stone transition-colors hover:border-amber hover:text-amber-deep"
              >
                {product.category}
              </Link>
              <span className="rounded-full bg-paper-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink">
                {caseSize}
              </span>
              <span
                className={cn(
                  'rounded-full px-3 py-1.5 font-mono text-[11px] font-medium tracking-wider',
                  STOCK_STYLES[product.stockStatus],
                )}
              >
                {STOCK_LABEL[product.stockStatus]}
              </span>
            </motion.div>

            {/* Price zone */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mt-6 border-t border-line pt-6"
            >
              {isAuthenticated ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold text-amber">$</span>
                    <span className="font-display text-4xl font-extrabold tracking-tight text-ink">
                      {priceDollars.toFixed(2)}
                    </span>
                    <span className="font-mono text-sm text-stone">/ case</span>
                    {msrp != null && (
                      <span className="ml-2 font-mono text-sm text-stone line-through">
                        MSRP ${msrp.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {unitPrice != null && (
                    <p className="mt-1.5 font-mono text-xs text-stone">
                      ${unitPrice.toFixed(2)} / unit · {unitCount} units per case
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <PriceLock price={0} size="lg" />
                  <p className="mt-3 max-w-sm text-[13px] font-medium text-stone">
                    Create a free wholesale account to view pricing and order.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Link
                      to={LOGIN_PATH}
                      className="inline-flex h-10 items-center rounded-lg bg-amber px-5 text-sm font-semibold text-paper transition-colors hover:bg-amber-deep"
                    >
                      Sign In
                    </Link>
                    <Link
                      to={LOGIN_PATH}
                      className="inline-flex h-10 items-center rounded-lg border border-amber px-5 text-sm font-semibold text-amber-deep transition-colors hover:bg-amber hover:text-paper"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Qty stepper + CTAs */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mt-6"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex items-center rounded-lg border border-line',
                    !isAuthenticated && 'opacity-50',
                  )}
                  title={!isAuthenticated ? 'Sign in to order' : undefined}
                >
                  <button
                    type="button"
                    disabled={!isAuthenticated || qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease cases"
                    className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-amber-deep disabled:cursor-not-allowed disabled:text-stone/50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-sm font-bold text-ink">{qty}</span>
                  <button
                    type="button"
                    disabled={!isAuthenticated}
                    onClick={() => setQty((q) => Math.min(999, q + 1))}
                    aria-label="Increase cases"
                    className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-amber-deep disabled:cursor-not-allowed disabled:text-stone/50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="font-mono text-xs uppercase tracking-wide text-stone">cases</span>
                {isAuthenticated && (
                  <span className="ml-auto font-mono text-xs text-stone">
                    EST. <span className="font-bold text-ink">${(priceDollars * qty).toFixed(2)}</span>
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Button
                      onClick={handleAdd}
                      disabled={outOfStock}
                      className={cn(
                        'h-12 w-full text-base font-semibold transition-colors',
                        added ? 'bg-forest text-paper hover:bg-forest' : 'bg-amber text-paper hover:bg-amber-deep',
                      )}
                    >
                      {added ? (
                        <>
                          <Check className="mr-2 h-5 w-5" strokeWidth={3} />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 w-full border-line font-semibold text-ink hover:border-amber hover:text-amber-deep"
                    >
                      Add to Standing Order
                    </Button>
                  </>
                ) : (
                  <Link
                    to={LOGIN_PATH}
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber text-base font-semibold text-paper transition-colors hover:bg-amber-deep"
                  >
                    <Lock className="h-4 w-4" />
                    Sign in to Order
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Delivery note */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mt-6 rounded-xl border border-line bg-paper-2 p-4"
            >
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-amber-deep" />
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold tracking-wide text-ink">
                    SHIPS STATEWIDE IN INDIANA — TYPICALLY WITHIN 48 HRS
                  </p>
                  <button
                    type="button"
                    onClick={() => setZipOpen((v) => !v)}
                    className="mt-1 font-mono text-[11px] font-semibold tracking-wide text-amber-deep underline underline-offset-4"
                  >
                    Check your ZIP
                  </button>
                  <AnimatePresence initial={false}>
                    {zipOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            value={zip}
                            onChange={(e) => {
                              setZip(e.target.value.replace(/\D/g, ''));
                              setZipResult(null);
                            }}
                            placeholder="46222"
                            className="h-9 w-28 rounded-lg border border-line bg-paper px-3 font-mono text-sm text-ink focus:border-amber focus:outline-none"
                          />
                          <Button
                            onClick={handleZipCheck}
                            className="h-9 bg-ink text-paper hover:bg-amber"
                          >
                            Check
                          </Button>
                        </div>
                        {zipResult === 'in' && (
                          <p className="mt-2 font-mono text-[11px] font-semibold tracking-wide text-forest">
                            ✓ WE DELIVER TO YOUR AREA
                          </p>
                        )}
                        {zipResult === 'out' && (
                          <p className="mt-2 font-mono text-[11px] font-semibold tracking-wide text-amber-deep">
                            INDIANA DELIVERY ONLY — OR PICK UP AT OUR WAREHOUSE
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Section 3: Details tabs ──────────────────────────────────────── */}
        <div className="mt-16 border-t border-line lg:mt-24">
          <div className="flex gap-8 overflow-x-auto" role="tablist" aria-label="Product details">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative whitespace-nowrap py-4 text-sm font-semibold transition-colors',
                  tab === t.id ? 'text-ink' : 'text-stone hover:text-ink',
                )}
              >
                {t.label}
                {tab === t.id && (
                  <motion.span
                    layoutId="pdp-tab-underline"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-amber"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="py-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
              >
                {tab === 'specs' && (
                  <dl className="max-w-3xl">
                    {specRows.map(([label, value], i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE_OUT, delay: i * 0.03 }}
                        className="flex items-baseline justify-between gap-6 border-b border-line py-3"
                      >
                        <dt className="font-mono text-[11px] font-bold tracking-[0.18em] text-stone">
                          {label}
                        </dt>
                        <dd className="text-right font-mono text-sm text-ink">{value}</dd>
                      </motion.div>
                    ))}
                  </dl>
                )}

                {tab === 'description' && (
                  <div className="max-w-3xl">
                    <p className="text-base leading-[1.6] text-ink md:text-lg">
                      {product.description ??
                        `${product.name} from ${product.brand} — a proven shelf performer for Indiana convenience, gas, and restaurant accounts. Stocked by the ${caseSize.toLowerCase()} for fast receiving and easy rotation, with dependable weekly availability out of our Indianapolis warehouse.`}
                    </p>
                    <p className="mt-4 text-[15px] leading-[1.6] text-stone">
                      Buyers count on this line for strong turns and healthy margins. Order by the
                      case and pair it with related items below to fill your truck route
                      efficiently.
                    </p>
                  </div>
                )}

                {tab === 'delivery' && (
                  <div className="max-w-3xl space-y-4 text-[15px] leading-[1.6] text-ink">
                    <p>
                      <strong className="font-semibold">Statewide delivery.</strong> We run our own
                      trucks to every corner of Indiana — most orders arrive within 48 hours.
                    </p>
                    <p>
                      <strong className="font-semibold">Cash &amp; carry.</strong> Prefer to pick
                      up? Will-call is available at {WAREHOUSE.address} during warehouse hours.
                    </p>
                    <p>
                      <strong className="font-semibold">Damaged goods.</strong> Report shortages or
                      damage within 48 hours of delivery and we&apos;ll credit your account on the
                      next invoice — no RMA paperwork.
                    </p>
                    <p className="font-mono text-xs tracking-wide text-stone">
                      MON–FRI 8AM–6PM · SAT 9AM–4PM · SUN CLOSED
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Section 4: Related products ────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-6 pb-16 lg:px-12 lg:pb-24">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="font-display text-2xl font-bold tracking-tight text-ink md:text-[32px]"
          >
            Pairs well with
          </motion.h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20%' }}
                transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.08 }}
              >
                <ProductCard product={toCardProduct(p)} className="h-full" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 5: Recently viewed ─────────────────────────────────────── */}
      <RecentlyViewed excludeSlug={product.slug} />
    </div>
  );
}
