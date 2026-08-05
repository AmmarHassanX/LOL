import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { keepPreviousData } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  LayoutGrid,
  List,
  Lock,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/catalog/FilterSidebar';
import CatalogListRow from '@/components/catalog/CatalogListRow';
import {
  EASE_OUT,
  SORT_OPTIONS,
  TAG_OPTIONS,
  categorySlugToName,
  centsToDollars,
  dollarsToCents,
  toCardProduct,
  type SortValue,
  type TagValue,
} from '@/components/catalog/catalog-utils';
import { CATEGORIES } from '@/data/catalog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/providers/trpc';
import { LOGIN_PATH } from '@/const';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;
const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));
const TAG_VALUES = new Set(TAG_OPTIONS.map((o) => o.value));

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

export default function Products() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── URL-driven filter state ────────────────────────────────────────────────
  const categoryParam = searchParams.get('category') ?? undefined;
  const brand = searchParams.get('brand') ?? undefined;
  const searchParam = searchParams.get('search') ?? '';
  const sortParam = searchParams.get('sort');
  const sort: SortValue = SORT_VALUES.has(sortParam as SortValue)
    ? (sortParam as SortValue)
    : 'newest';
  const tagParam = searchParams.get('tag');
  const tag = TAG_VALUES.has(tagParam as TagValue) ? (tagParam as TagValue) : undefined;
  const inStockOnly = searchParams.get('stock') === '1';
  const minParam = searchParams.get('min');
  const maxParam = searchParams.get('max');

  const setParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next);
  };

  // ── Search input (debounced → URL) + "/" shortcut ─────────────────────────
  const [searchInput, setSearchInput] = useState(searchParam);
  useEffect(() => setSearchInput(searchParam), [searchParam]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== searchParam) {
        setParams({ search: searchInput.trim() || undefined });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Data ───────────────────────────────────────────────────────────────────
  const metaQuery = trpc.products.meta.useQuery();
  const meta = metaQuery.data;

  const priceBounds: [number, number] = useMemo(() => {
    if (!meta || meta.priceRange.max <= 0) return [0, 500];
    return [Math.floor(centsToDollars(meta.priceRange.min)), Math.ceil(centsToDollars(meta.priceRange.max))];
  }, [meta]);

  const priceMin = minParam != null ? Number(minParam) : priceBounds[0];
  const priceMax = maxParam != null ? Number(maxParam) : priceBounds[1];
  const priceActive = minParam != null || maxParam != null;

  const categoryName = categoryParam ? categorySlugToName(categoryParam) : undefined;

  const listQuery = trpc.products.list.useQuery(
    {
      category: categoryName,
      brand,
      search: searchParam || undefined,
      minPrice: minParam != null ? dollarsToCents(Number(minParam)) : undefined,
      maxPrice: maxParam != null ? dollarsToCents(Number(maxParam)) : undefined,
      inStockOnly: inStockOnly || undefined,
      tag,
      sort,
      limit: Math.min(visibleCount, 100),
      offset: 0,
    },
    { placeholderData: keepPreviousData },
  );

  const products = listQuery.data?.products ?? [];
  const total = listQuery.data?.total ?? 0;
  const shown = Math.min(products.length, total);

  // Reset pagination whenever the result set definition changes.
  const filterSignature = `${categoryName}|${brand}|${searchParam}|${minParam}|${maxParam}|${inStockOnly}|${tag}|${sort}`;
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterSignature]);

  // ── Active filter chips ────────────────────────────────────────────────────
  const chips: Chip[] = [];
  if (categoryParam && categoryName) {
    chips.push({
      key: 'category',
      label: categoryName,
      onRemove: () => setParams({ category: undefined }),
    });
  }
  if (brand) chips.push({ key: 'brand', label: brand, onRemove: () => setParams({ brand: undefined }) });
  if (searchParam) {
    chips.push({ key: 'search', label: `"${searchParam}"`, onRemove: () => setParams({ search: undefined }) });
  }
  if (priceActive) {
    chips.push({
      key: 'price',
      label: isAuthenticated ? `$${priceMin}–$${priceMax}` : 'CASE PRICE RANGE',
      onRemove: () => setParams({ min: undefined, max: undefined }),
    });
  }
  if (inStockOnly) {
    chips.push({ key: 'stock', label: 'IN STOCK', onRemove: () => setParams({ stock: undefined }) });
  }
  if (tag) {
    chips.push({
      key: 'tag',
      label: TAG_OPTIONS.find((t) => t.value === tag)?.label ?? tag,
      onRemove: () => setParams({ tag: undefined }),
    });
  }
  const clearAll = () =>
    setParams({
      category: undefined,
      brand: undefined,
      search: undefined,
      min: undefined,
      max: undefined,
      stock: undefined,
      tag: undefined,
    });

  const sidebarProps = {
    meta,
    isAuthenticated,
    category: categoryParam,
    brand,
    price: [priceMin, priceMax] as [number, number],
    priceBounds,
    inStockOnly,
    tag,
    onCategory: (slug?: string) => setParams({ category: slug }),
    onBrand: (b?: string) => setParams({ brand: b }),
    onPrice: (min: number, max: number) =>
      setParams({
        min: min > priceBounds[0] ? String(min) : undefined,
        max: max < priceBounds[1] ? String(max) : undefined,
      }),
    onInStockOnly: (v: boolean) => setParams({ stock: v ? '1' : undefined }),
    onTag: (t?: TagValue) => setParams({ tag: t }),
  };

  return (
    <div className="bg-paper">
      {/* ── Section 1: Page header ─────────────────────────────────────────── */}
      <section className="border-b border-line bg-paper-2">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6 px-6 py-12 lg:px-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">
              {'// WHOLESALE CATALOG'}
            </p>
            <h1 className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:text-5xl">
              The Catalog
            </h1>
            <p className="mt-3 font-mono text-xs tracking-wide text-stone">
              {(meta ? meta.categories.reduce((n, c) => n + c.count, 0) : total).toLocaleString()}{' '}
              PRODUCTS · {meta?.categories.length ?? 8} DEPARTMENTS · STATEWIDE DELIVERY
            </p>
          </motion.div>

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.15 }}
            >
              <Link
                to={LOGIN_PATH}
                className="inline-flex items-center gap-2 rounded-full bg-amber-soft px-4 py-2.5 font-mono text-xs font-medium text-amber-deep transition-colors hover:bg-amber hover:text-paper"
              >
                <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
                Sign in to view wholesale pricing &amp; place orders
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Section 2: Sticky toolbar ──────────────────────────────────────── */}
      <div className="sticky top-[72px] z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-6 lg:px-12">
          {/* Mobile filters button */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-amber px-3 text-sm font-semibold text-paper transition-colors hover:bg-amber-deep lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {chips.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-paper px-1 font-mono text-[10px] font-bold text-amber-deep">
                {chips.length}
              </span>
            )}
          </button>

          {/* Search */}
          <div className="relative min-w-0 flex-1 md:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products, brands, SKUs…"
              className="h-10 w-full rounded-lg border border-line bg-paper pl-9 pr-8 text-sm text-ink transition-[width] duration-300 placeholder:text-stone/70 focus:border-amber focus:outline-none md:w-[240px] md:focus:w-[320px]"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[10px] text-stone md:block">
              /
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Results count */}
            <span className="hidden font-mono text-xs text-stone sm:block">
              {listQuery.isLoading ? 'LOADING…' : `${total.toLocaleString()} RESULTS`}
            </span>

            {/* Sort */}
            <Select value={sort} onValueChange={(v) => setParams({ sort: v === 'newest' ? undefined : v })}>
              <SelectTrigger
                className="h-10 w-[170px] rounded-lg border-line bg-paper text-sm"
                title={!isAuthenticated ? 'Sign in to see prices' : undefined}
                aria-label="Sort products"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="hidden items-center rounded-lg border border-line p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  view === 'grid' ? 'bg-ink text-paper' : 'text-stone hover:text-ink',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                aria-label="List view"
                aria-pressed={view === 'list'}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  view === 'list' ? 'bg-ink text-paper' : 'text-stone hover:text-ink',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections 3 + 4: Sidebar + results ──────────────────────────────── */}
      <div className="mx-auto flex max-w-[1280px] gap-10 px-6 py-10 lg:px-12">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div
            className="sticky top-[150px] max-h-[calc(100dvh-170px)] overflow-y-auto pb-6 pr-2"
            data-lenis-prevent
          >
            <FilterSidebar {...sidebarProps} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Active filter chips */}
          <AnimatePresence>
            {chips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="mb-6 flex flex-wrap items-center gap-2"
              >
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-stone">
                  {'// Active filters'}
                </span>
                {chips.map((chip) => (
                  <motion.button
                    key={chip.key}
                    type="button"
                    onClick={chip.onRemove}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    className="group flex items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-amber-deep transition-colors hover:bg-amber hover:text-paper"
                  >
                    {chip.label}
                    <X className="h-3 w-3" strokeWidth={3} />
                  </motion.button>
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-mono text-[11px] font-semibold uppercase tracking-wide text-stone underline underline-offset-4 transition-colors hover:text-amber-deep"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading skeletons */}
          {listQuery.isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-line">
                  <Skeleton className="aspect-[4/3] w-full rounded-none bg-paper-2" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-3 w-20 bg-paper-2" />
                    <Skeleton className="h-4 w-full bg-paper-2" />
                    <Skeleton className="h-6 w-24 bg-paper-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {listQuery.isError && !listQuery.isLoading && (
            <div className="flex flex-col items-center py-24 text-center">
              <p className="font-mono text-2xl font-bold tracking-[0.18em] text-ink">
                COULDN'T LOAD CATALOG
              </p>
              <p className="mt-3 max-w-sm text-[15px] text-stone">
                Something went wrong reaching the warehouse terminal. Try again.
              </p>
              <Button
                onClick={() => listQuery.refetch()}
                className="mt-6 bg-amber text-paper hover:bg-amber-deep"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!listQuery.isLoading && !listQuery.isError && products.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="flex flex-col items-center py-24 text-center"
            >
              <PackageSearch className="h-10 w-10 text-stone" strokeWidth={1.5} />
              <p className="mt-6 font-mono text-3xl font-bold tracking-[0.18em] text-ink">
                NO MATCHES
              </p>
              <p className="mt-3 max-w-sm text-[15px] text-stone">
                Try clearing a filter or two.
              </p>
              <Button
                onClick={clearAll}
                variant="outline"
                className="mt-6 border-amber text-amber-deep hover:bg-amber hover:text-paper"
              >
                Clear all filters
              </Button>
            </motion.div>
          )}

          {/* Results */}
          {!listQuery.isLoading && !listQuery.isError && products.length > 0 && (
            <>
              {view === 'list' && (
                <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_150px_120px_130px_150px_32px] gap-4 border-b border-line px-3 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stone md:grid">
                  <span>Product</span>
                  <span>Brand</span>
                  <span>Case</span>
                  <span>Stock</span>
                  <span>Price</span>
                  <span />
                </div>
              )}
              <motion.div
                layout
                className={
                  view === 'grid'
                    ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'
                    : 'flex flex-col border-t border-transparent'
                }
              >
                <AnimatePresence mode="popLayout">
                  {products.map((p, i) => (
                    <motion.div
                      key={`${view}-${p.id}`}
                      layout
                      initial={{ opacity: 0, y: view === 'grid' ? 32 : 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{
                        duration: 0.35,
                        ease: EASE_OUT,
                        delay: Math.min(i * 0.04, 0.32),
                        layout: { type: 'spring', stiffness: 300, damping: 30 },
                      }}
                    >
                      {view === 'grid' ? (
                        <ProductCard product={toCardProduct(p)} className="h-full" />
                      ) : (
                        <CatalogListRow product={p} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Load more */}
              {total > shown && (
                <div className="mt-10 flex flex-col items-center gap-4">
                  <div className="h-px w-full max-w-sm bg-line">
                    <motion.div
                      className="h-px bg-amber"
                      initial={false}
                      animate={{ width: `${Math.min(100, (shown / total) * 100)}%` }}
                      transition={{ duration: 0.4, ease: EASE_OUT }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    disabled={listQuery.isFetching}
                    className="border-amber px-8 text-amber-deep hover:bg-amber hover:text-paper"
                  >
                    {listQuery.isFetching ? 'Loading…' : 'Load more'}
                  </Button>
                  <span className="font-mono text-[11px] tracking-wide text-stone">
                    SHOWING {shown} OF {total.toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Section 5: Department shortcut band ────────────────────────────── */}
      <section className="border-y border-line bg-paper-2 py-12">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="flex items-end justify-between gap-4"
          >
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              Shop by department
            </h2>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-stone sm:block">
              Scroll →
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
            className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            data-lenis-prevent
          >
            {CATEGORIES.map((c) => {
              const count = meta?.categories.find((m) => m.category === c.name)?.count;
              const active = categoryParam === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setParams({ category: active ? undefined : c.slug })}
                  aria-pressed={active}
                  className={cn(
                    'group w-[160px] shrink-0 snap-start overflow-hidden rounded-xl border bg-paper text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]',
                    active ? 'border-amber ring-2 ring-amber' : 'border-line',
                  )}
                >
                  <span className="block aspect-square overflow-hidden bg-paper-2">
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="block p-3">
                    <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                    <span className="mt-0.5 block font-mono text-[10px] tracking-wide text-stone">
                      {count != null ? `${count} ITEMS` : 'BROWSE'}
                    </span>
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Section 6: Gated-pricing explainer (guests only) ───────────────── */}
      {!isAuthenticated && (
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { icon: Lock, text: 'Pricing unlocks after a quick business signup' },
                { icon: Truck, text: 'Statewide Indiana delivery on every order' },
                { icon: BadgeCheck, text: 'Family owned, 10 years serving Indiana stores.' },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-15%' }}
                  transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-soft text-amber-deep">
                    <item.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <p className="pt-2 text-[15px] font-medium text-ink">{item.text}</p>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.3 }}
              className="mt-10"
            >
              <Link
                to={LOGIN_PATH}
                className="group inline-flex items-center gap-2 rounded-lg border-2 border-amber px-6 py-3 font-semibold text-amber-deep transition-colors hover:bg-amber hover:text-paper"
              >
                Create Free Wholesale Account
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Mobile filter sheet ────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-paper px-6 pb-10"
        >
          <SheetHeader className="pb-2 text-left">
            <SheetTitle className="font-display text-lg font-semibold text-ink">
              Filters
              {chips.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-3 font-mono text-[11px] font-semibold uppercase tracking-wide text-stone underline underline-offset-4"
                >
                  Clear all
                </button>
              )}
            </SheetTitle>
          </SheetHeader>
          <FilterSidebar {...sidebarProps} instant />
          <Button
            onClick={() => setSheetOpen(false)}
            className="mt-6 w-full bg-amber text-paper hover:bg-amber-deep"
          >
            Show {total.toLocaleString()} results
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
