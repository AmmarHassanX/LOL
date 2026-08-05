import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const TESTIMONIALS = [
  {
    quote: 'MB keeps our shelves full and our margins healthy. Same-day answers, every time.',
    name: 'Gas station owner',
    meta: 'GAS STATION — LAFAYETTE, IN',
  },
  {
    quote: 'One truck, one invoice, everything from vapes to napkins. It simplified our whole back room.',
    name: 'Restaurant operator',
    meta: 'RESTAURANT — BLOOMINGTON, IN',
  },
  {
    quote: "Ten years in and they've never missed a route day. That's why we stay.",
    name: 'C-store manager',
    meta: 'C-STORE — EVANSVILLE, IN',
  },
];

/** Section 8 — testimonials. */
export default function Testimonials() {
  return (
    <section className="bg-paper-2 py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// PARTNERS</p>
          <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:text-[56px]">
            Stores that stock with us.
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.meta}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT }}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-paper p-7"
            >
              <span
                aria-hidden
                className="absolute -top-3 right-5 font-display text-[120px] font-extrabold leading-none text-amber-soft transition-transform duration-500 group-hover:rotate-6"
              >
                &ldquo;
              </span>
              <div className="relative flex gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="relative mt-5 flex-1 text-base leading-relaxed text-ink md:text-lg">
                {t.quote}
              </blockquote>
              <figcaption className="relative mt-6">
                <p className="font-display text-base font-semibold text-ink">{t.name}</p>
                <p className="mt-1 font-mono text-[11px] tracking-wide text-stone">{t.meta}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
