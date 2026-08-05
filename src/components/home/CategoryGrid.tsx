import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '@/data/catalog';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

/** Section 3 — category grid ("Everything your store carries"). */
export default function CategoryGrid() {
  return (
    <section className="bg-paper py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// DEPARTMENTS</p>
            <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:text-[56px]">
              Eight departments.
              <br />
              One delivery.
            </h2>
          </div>
          <Link
            to="/products"
            className="group flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-amber-deep"
          >
            View all products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: EASE_OUT }}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className="group block overflow-hidden rounded-xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-amber hover:shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]"
              >
                <div className="aspect-square overflow-hidden bg-paper-2">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink md:text-base">{cat.name}</h3>
                    <p className="mt-1 font-mono text-[10px] tracking-wide text-stone">
                      {cat.count} PRODUCTS
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
