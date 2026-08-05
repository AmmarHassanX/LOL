import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { FEATURED_PRODUCTS } from '@/data/catalog';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const TABS = [
  { id: 'best-seller', label: 'Best Sellers' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'promo', label: 'On Promotion' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Section 4 — featured products ("This week's movers"). */
export default function FeaturedProducts() {
  const [tab, setTab] = useState<TabId>('best-seller');

  const products = useMemo(
    () => FEATURED_PRODUCTS.filter((p) => p.tags.includes(tab)).slice(0, 6),
    [tab],
  );

  return (
    <section className="border-y border-line bg-paper-2 py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// CATALOG PREVIEW</p>
            <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:text-[56px]">
              Fast movers, ready to ship.
            </h2>
          </div>

          {/* Segmented tabs with animated underline */}
          <div className="flex gap-6 border-b border-line" role="tablist" aria-label="Featured product filters">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative pb-3 text-sm font-semibold transition-colors',
                  tab === t.id ? 'text-ink' : 'text-stone hover:text-ink',
                )}
              >
                {t.label}
                {tab === t.id && (
                  <motion.span
                    layoutId="featured-tab-underline"
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-amber"
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div layout className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.4, delay: i * 0.05, type: 'spring', stiffness: 260, damping: 26 }}
              >
                <ProductCard product={p} className="h-full" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 text-center"
        >
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 rounded-lg border-2 border-amber px-6 py-3.5 text-sm font-semibold text-amber-deep transition-all duration-150 hover:bg-amber hover:text-paper active:scale-[0.97]"
          >
            View Full Catalog (2,000+ products)
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
