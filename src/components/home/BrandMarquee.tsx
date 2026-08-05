import { memo } from 'react';
import { motion } from 'framer-motion';
import { BRANDS_ROW_1, BRANDS_ROW_2 } from '@/data/catalog';
import { cn } from '@/lib/utils';

function BrandChips({ brands }: { brands: string[] }) {
  return (
    <>
      {brands.map((b) => (
        <span
          key={b}
          className="mx-2.5 whitespace-nowrap rounded-full border border-line px-5 py-2.5 font-mono text-xs font-medium tracking-[0.14em] text-ink"
        >
          {b}
        </span>
      ))}
    </>
  );
}

const MarqueeRow = memo(function MarqueeRow({ brands, reverse }: { brands: string[]; reverse?: boolean }) {
  return (
    <div className="marquee-paused flex overflow-hidden py-2">
      <div
        className={cn(
          'marquee-track flex w-max items-center',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee',
        )}
      >
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
            <BrandChips brands={brands} />
          </div>
        ))}
      </div>
    </div>
  );
});

/** Section 7 — brand marquee + blurb. */
export default function BrandMarquee() {
  return (
    <section className="overflow-hidden border-y border-line bg-paper py-16 lg:py-24">
      <motion.div
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mx-auto max-w-[1280px] px-6 lg:px-12"
      >
        <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// BRANDS WE CARRY</p>
        <h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-ink md:text-[32px]">
          The names your customers already trust.
        </h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
        className="mt-10"
      >
        <MarqueeRow brands={BRANDS_ROW_1} />
        <MarqueeRow brands={BRANDS_ROW_2} reverse />
      </motion.div>
    </section>
  );
}
