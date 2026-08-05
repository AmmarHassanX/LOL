import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ORDER_STEPS = ['PLACED', 'CONFIRMED', 'PICKED', 'OUT FOR DELIVERY', 'DELIVERED'] as const;

interface OrderStatusStepperProps {
  /** 0-based index of the current step (0 = PLACED ... 4 = DELIVERED) */
  currentStep: number;
  className?: string;
}

/**
 * Shared 5-step order status stepper.
 * Completed steps: forest + check. Current: amber with pulsing ring.
 * Future: stone. Vertical on mobile.
 */
export default function OrderStatusStepper({ currentStep, className }: OrderStatusStepperProps) {
  return (
    <ol className={cn('flex flex-col gap-6 md:flex-row md:items-start md:gap-0', className)}>
      {ORDER_STEPS.map((label, i) => {
        const done = i < currentStep;
        const current = i === currentStep;
        return (
          <li key={label} className="relative flex items-center gap-3 md:flex-1 md:flex-col md:items-center md:gap-2">
            {/* connector */}
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  'absolute md:left-[calc(-50%+18px)] md:top-[17px] md:h-px md:w-[calc(100%-36px)]',
                  'max-md:-top-6 max-md:left-[17px] max-md:h-6 max-md:w-px',
                  done || current ? 'bg-forest' : 'bg-line',
                )}
              />
            )}
            <span
              className={cn(
                'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-medium',
                done && 'border-forest bg-forest text-paper',
                current && 'border-amber bg-amber text-paper',
                !done && !current && 'border-line bg-paper text-stone',
              )}
            >
              {current && (
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-amber [animation-duration:2s]" />
              )}
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : String(i + 1).padStart(2, '0')}
            </span>
            <span
              className={cn(
                'font-mono text-[11px] font-medium tracking-wider md:text-center',
                done && 'text-forest',
                current && 'text-amber-deep',
                !done && !current && 'text-stone',
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
