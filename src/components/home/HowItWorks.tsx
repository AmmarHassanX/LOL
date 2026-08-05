import { motion } from 'framer-motion';
import { ShoppingCart, Truck, UserPlus } from 'lucide-react';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const STEPS = [
  {
    num: '01',
    icon: UserPlus,
    title: 'Create your account',
    body: 'Register with your business details. Approval is fast — usually same day.',
  },
  {
    num: '02',
    icon: ShoppingCart,
    title: 'Shop wholesale pricing',
    body: 'Unlock member pricing across all eight departments and build your order by the case.',
  },
  {
    num: '03',
    icon: Truck,
    title: 'We deliver statewide',
    body: 'Pick your delivery window. Our trucks reach every ZIP in Indiana.',
  },
];

/** Section 6 — how it works (3 steps). */
export default function HowItWorks() {
  return (
    <section className="bg-paper py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// GETTING STARTED</p>
          <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:text-[56px]">
            Ordering, simplified.
          </h2>
        </motion.div>

        <div className="relative mt-16">
          {/* Dashed connector (draws on scroll) — desktop only */}
          <svg
            aria-hidden
            className="absolute left-0 right-0 top-9 hidden w-full md:block"
            height="2"
            preserveAspectRatio="none"
            viewBox="0 0 100 2"
          >
            <motion.line
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              stroke="#E8551D"
              strokeWidth="2"
              strokeDasharray="6 6"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
            />
          </svg>

          <div className="grid gap-12 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20%' }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: EASE_OUT }}
                className="relative"
              >
                <p className="font-mono text-5xl font-bold text-amber">{step.num}</p>
                <motion.div
                  initial={{ rotate: 360, scale: 0.6, opacity: 0 }}
                  whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: '-20%' }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease: EASE_OUT }}
                  className="mt-6 flex h-[72px] w-[72px] items-center justify-center rounded-full border border-line bg-paper"
                >
                  <step.icon className="h-7 w-7 text-ink" strokeWidth={1.75} />
                </motion.div>
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[320px] text-[15px] leading-relaxed text-stone">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
