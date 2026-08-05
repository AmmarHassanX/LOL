import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Search } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { CATEGORIES } from '@/data/catalog';
import { cn } from '@/lib/utils';
import {
  EASE_OUT,
  TAG_OPTIONS,
  categoryNameToSlug,
  type CatalogMeta,
  type TagValue,
} from './catalog-utils';

interface FilterSidebarProps {
  meta?: CatalogMeta;
  isAuthenticated: boolean;
  /** Active category slug, if any */
  category?: string;
  brand?: string;
  /** Current price bounds in dollars */
  price: [number, number];
  /** Full catalog price bounds in dollars */
  priceBounds: [number, number];
  inStockOnly: boolean;
  tag?: TagValue;
  onCategory: (slug?: string) => void;
  onBrand: (brand?: string) => void;
  onPrice: (min: number, max: number) => void;
  onInStockOnly: (v: boolean) => void;
  onTag: (tag?: TagValue) => void;
  /** Disable mount stagger (e.g. inside mobile sheet) */
  instant?: boolean;
}

function Group({
  title,
  index,
  instant,
  children,
}: {
  title: string;
  index: number;
  instant?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={instant ? false : { opacity: 0, y: 16 }}
      animate={instant ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.1 + index * 0.05 }}
      className="border-b border-line py-6 first:pt-0 last:border-b-0"
    >
      <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-stone">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

/** Catalog filter rail — category, brand, price, availability, tags. */
export default function FilterSidebar({
  meta,
  isAuthenticated,
  category,
  brand,
  price,
  priceBounds,
  inStockOnly,
  tag,
  onCategory,
  onBrand,
  onPrice,
  onInStockOnly,
  onTag,
  instant,
}: FilterSidebarProps) {
  const [brandQuery, setBrandQuery] = useState('');
  // Local slider state so thumbs glide; commits propagate to the URL.
  const [draftPrice, setDraftPrice] = useState<[number, number] | null>(null);
  const shownPrice = draftPrice ?? price;

  const categories = useMemo(() => {
    if (meta && meta.categories.length > 0) {
      return meta.categories.map((c) => ({
        slug: categoryNameToSlug(c.category),
        name: c.category,
        count: c.count,
      }));
    }
    return CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, count: c.count }));
  }, [meta]);

  const brands = useMemo(() => {
    const list = meta?.brands ?? [];
    const q = brandQuery.trim().toLowerCase();
    return q ? list.filter((b) => b.brand.toLowerCase().includes(q)) : list;
  }, [meta, brandQuery]);

  return (
    <div>
      {/* Category */}
      <Group title="// Department" index={0} instant={instant}>
        <ul className="flex flex-col gap-1">
          {categories.map((c) => {
            const active = category === c.slug;
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => onCategory(active ? undefined : c.slug)}
                  aria-pressed={active}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    active ? 'bg-amber-soft font-semibold text-ink' : 'text-stone hover:bg-paper-2 hover:text-ink',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        active ? 'border-amber bg-amber text-paper' : 'border-line bg-paper group-hover:border-stone',
                      )}
                    >
                      {active && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    {c.name}
                  </span>
                  <span className="font-mono text-[11px] text-stone">{c.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Group>

      {/* Brand */}
      <Group title="// Brand" index={1} instant={instant}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone" />
          <input
            type="text"
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
            placeholder="Search brands…"
            className="h-9 w-full rounded-lg border border-line bg-paper pl-8 pr-3 text-sm text-ink placeholder:text-stone/70 focus:border-amber focus:outline-none"
          />
        </div>
        <ul className="mt-3 flex max-h-[220px] flex-col gap-1 overflow-y-auto pr-1" data-lenis-prevent>
          {brands.map((b) => {
            const active = brand === b.brand;
            return (
              <li key={b.brand}>
                <button
                  type="button"
                  onClick={() => onBrand(active ? undefined : b.brand)}
                  aria-pressed={active}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                    active ? 'bg-amber-soft font-semibold text-ink' : 'text-stone hover:bg-paper-2 hover:text-ink',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        active ? 'border-amber bg-amber text-paper' : 'border-line bg-paper group-hover:border-stone',
                      )}
                    >
                      {active && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    {b.brand}
                  </span>
                  <span className="font-mono text-[11px] text-stone">{b.count}</span>
                </button>
              </li>
            );
          })}
          {brands.length === 0 && (
            <li className="px-2.5 py-2 font-mono text-[11px] uppercase tracking-wide text-stone">
              No brands match
            </li>
          )}
        </ul>
      </Group>

      {/* Price range (per case) */}
      <Group title="// Case Price" index={2} instant={instant}>
        <Slider
          min={priceBounds[0]}
          max={Math.max(priceBounds[1], priceBounds[0] + 1)}
          step={1}
          value={[shownPrice[0], shownPrice[1]]}
          onValueChange={(v) => setDraftPrice([v[0] ?? priceBounds[0], v[1] ?? priceBounds[1]])}
          onValueCommit={(v) => {
            setDraftPrice(null);
            onPrice(v[0] ?? priceBounds[0], v[1] ?? priceBounds[1]);
          }}
          className="mt-2"
        />
        <div className="mt-3 flex items-center justify-between font-mono text-xs text-stone">
          {isAuthenticated ? (
            <>
              <span>${shownPrice[0]}</span>
              <span>${shownPrice[1]}</span>
            </>
          ) : (
            <>
              <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-deep">
                SIGN IN
              </span>
              <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-deep">
                SIGN IN
              </span>
            </>
          )}
        </div>
      </Group>

      {/* Availability */}
      <Group title="// Availability" index={3} instant={instant}>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-paper-2">
          <span>In stock only</span>
          <Switch checked={inStockOnly} onCheckedChange={onInStockOnly} aria-label="In stock only" />
        </label>
        <p className="mt-1 px-2.5 text-[13px] text-stone">Hides out-of-stock items from results.</p>
      </Group>

      {/* Tags */}
      <Group title="// Tags" index={4} instant={instant}>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((t) => {
            const active = tag === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onTag(active ? undefined : t.value)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide transition-colors',
                  active
                    ? 'border-amber bg-amber text-paper'
                    : 'border-line bg-paper text-stone hover:border-amber hover:text-amber-deep',
                )}
              >
                {t.value === 'promo' && (
                  <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-paper' : 'bg-amber')} />
                )}
                {t.label}
              </button>
            );
          })}
        </div>
      </Group>
    </div>
  );
}
