import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['DETAILS', 'DELIVERY', 'REVIEW'] as const;

interface CheckoutStepperProps {
  /** 1-based current step */
  step: number;
}

/** Horizontal mono step header with animated fill between steps. */
export default function CheckoutStepper({ step }: CheckoutStepperProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3" aria-label={`Checkout step ${step} of 3`}>
      {STEPS.map((label, i) => {
        const index = i + 1;
        const done = index < step;
        const current = index === step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2 last:flex-none sm:gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[11px] font-bold transition-colors duration-300',
                  done && 'border-forest bg-forest text-paper',
                  current && 'border-amber bg-amber text-paper',
                  !done && !current && 'border-line bg-paper text-stone',
                )}
              >
                {current && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-amber"
                    animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index}
              </span>
              <span
                className={cn(
                  'hidden font-mono text-[11px] font-bold tracking-[0.14em] sm:block',
                  current ? 'text-ink' : done ? 'text-forest' : 'text-stone',
                )}
              >
                {index} {label}
              </span>
            </div>
            {index < STEPS.length && (
              <div className="relative h-px min-w-4 flex-1 overflow-hidden bg-line">
                <motion.div
                  className="absolute inset-y-0 left-0 w-full bg-forest"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
