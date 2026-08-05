import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PriceLock from '@/components/PriceLock';
import { useAuth } from '@/hooks/useAuth';
import { STOCK_LABEL } from '@/data/catalog';
import { cn } from '@/lib/utils';
import { EASE_OUT } from './catalog-utils';
import {
  RECENTLY_VIEWED_EVENT,
  readRecentlyViewed,
  type RecentItem,
} from './recently-viewed-store';

/** Horizontal snap-scroll strip of recently viewed products. Hidden if empty. */
export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<RecentItem[]>(() => readRecentlyViewed());

  useEffect(() => {
    const onChange = () => setItems(readRecentlyViewed());
    window.addEventListener(RECENTLY_VIEWED_EVENT, onChange);
    return () => window.removeEventListener(RECENTLY_VIEWED_EVENT, onChange);
  }, []);

  const visible = useMemo(
    () => items.filter((i) => i.slug !== excludeSlug),
    [items, excludeSlug],
  );

  if (visible.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="border-t border-line py-12"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-stone">
          {'// Recently viewed'}
        </p>
        <div
          className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-lenis-prevent
        >
          {visible.map((item) => (
            <Link
              key={item.slug}
              to={`/products/${item.slug}`}
              className="group flex w-[220px] shrink-0 snap-start items-center gap-3 rounded-xl border border-line bg-paper p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper-2">
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span
                  className={cn(
                    'absolute left-1 top-1 h-1.5 w-1.5 rounded-full',
                    item.stock === 'in' ? 'bg-forest' : item.stock === 'low' ? 'bg-amber' : 'bg-stone',
                  )}
                  title={STOCK_LABEL[item.stock]}
                />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] uppercase tracking-wide text-stone">
                  {item.brand}
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-ink">
                  {item.name}
                </span>
                <span className="mt-1 block">
                  {isAuthenticated && item.casePrice == null ? (
                    <span className="font-mono text-xs text-stone">—</span>
                  ) : (
                    <PriceLock price={item.casePrice ?? 0} unit="case" />
                  )}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
