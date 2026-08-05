import { memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import { LOGIN_PATH } from '@/const';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

function KineticLine({ words, delay, className }: { words: string[]; delay: number; className?: string }) {
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ delay: delay + i * 0.06, duration: 0.9, ease: EASE_OUT }}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Perpetual float loop, isolated + memoized so it never resets. */
const StatChip = memo(function StatChip({
  label,
  className,
  delay,
}: {
  label: string;
  className?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 18 }}
      className={className}
    >
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
        className="rounded-full border border-line bg-paper/95 px-4 py-2 font-mono text-[11px] font-bold tracking-[0.14em] text-ink shadow-[0_12px_32px_-12px_rgba(22,21,15,0.18)] backdrop-blur"
      >
        {label}
      </motion.div>
    </motion.div>
  );
});

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const watermarkY = useTransform(scrollYProgress, [0, 1], [0, 180]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-paper">
      {/* Indiana watermark */}
      <motion.img
        src="/indiana-outline.svg"
        alt=""
        aria-hidden
        style={{ y: watermarkY }}
        className="pointer-events-none absolute -right-24 top-1/2 h-[130%] w-auto -translate-y-1/2 opacity-[0.08]"
      />

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 pb-16 pt-24 lg:grid-cols-12 lg:px-12 lg:pb-24 lg:pt-32">
        {/* Text */}
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2.5 font-mono text-xs font-bold tracking-[0.18em] text-stone"
          >
            <span className="h-2 w-2 bg-amber" />
            {'// WHOLESALE DISTRIBUTOR — INDIANAPOLIS, IN'}
          </motion.p>

          <h1 className="mt-6 font-display text-[40px] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink md:text-[72px]">
            <KineticLine words={['Stock', 'your', 'shelves.']} delay={0.2} className="block" />
            <KineticLine words={['We', 'handle', 'the', 'rest.']} delay={0.4} className="block text-amber" />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-4 font-mono text-sm tracking-[0.14em] text-stone md:text-base"
          >
            QUALITY SERVICE · QUALITY PRODUCTS · QUALITY PRICES
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.7, ease: EASE_OUT }}
            className="mt-6 max-w-[480px] text-base leading-relaxed text-stone md:text-lg"
          >
            Vapes, tobacco, snacks, beverages, gas station &amp; restaurant supplies — 2,000+
            products from the brands your customers ask for, delivered anywhere in Indiana.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7, ease: EASE_OUT }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/products"
              className="group inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
            >
              Browse the Catalog
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={LOGIN_PATH}
              className="inline-flex items-center gap-2 rounded-lg border border-ink/20 px-6 py-3.5 text-sm font-semibold text-ink transition-all duration-150 hover:border-ink active:scale-[0.97]"
            >
              Create Wholesale Account
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.25, duration: 0.6 }}
            className="mt-5 flex items-center gap-2 font-mono text-xs text-stone"
          >
            <Lock className="h-3.5 w-3.5 text-amber" />
            Wholesale pricing — sign in to view.
          </motion.p>
        </div>

        {/* Image card */}
        <div className="relative lg:col-span-5">
          <motion.div
            initial={{ scale: 0.94, clipPath: 'inset(100% 0 0 0)' }}
            animate={{ scale: 1, clipPath: 'inset(0% 0 0 0)' }}
            transition={{ delay: 0.35, duration: 1, ease: EASE_OUT }}
            className="rotate-2 overflow-hidden rounded-[20px] border border-line"
          >
            <img
              src="/hero-warehouse.jpg"
              alt="MB Wholesale warehouse aisle stocked with cases"
              className="aspect-[4/5] w-full object-cover md:aspect-[5/6]"
            />
          </motion.div>

          <StatChip label="2,000+ PRODUCTS" delay={1.2} className="absolute -left-4 top-8" />
          <StatChip label="10 YRS FAMILY OWNED" delay={1.35} className="absolute -right-3 top-1/3" />
          <StatChip label="STATEWIDE DELIVERY" delay={1.5} className="absolute -bottom-4 left-8" />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="mx-auto flex max-w-[1280px] items-center gap-3 px-6 pb-10 lg:px-12"
      >
        <motion.span
          className="block h-10 w-px bg-[repeating-linear-gradient(to_bottom,#6E6A5E_0_4px,transparent_4px_8px)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="font-mono text-[10px] tracking-[0.24em] text-stone">SCROLL</span>
      </motion.div>
    </section>
  );
}
