import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HOURS_ROWS, WILL_CALL_ROW } from './hours';

/** Mono operating-hours table with hairline rows; rows stagger in like a departure board. */
export default function HoursTable({
  showWillCall = false,
  dark = false,
  compact = false,
  animated = true,
  className,
}: {
  showWillCall?: boolean;
  dark?: boolean;
  compact?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const rows = showWillCall ? [...HOURS_ROWS, WILL_CALL_ROW] : HOURS_ROWS;

  return (
    <table className={cn('w-full font-mono', compact ? 'text-xs' : 'text-sm', className)}>
      <tbody>
        {rows.map(([day, hours], i) => (
          <motion.tr
            key={day}
            initial={animated ? { opacity: 0, y: 12 } : false}
            whileInView={animated ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
            className={cn('border-b last:border-b-0', dark ? 'border-paper/10' : 'border-line')}
          >
            <td
              className={cn(
                compact ? 'py-2' : 'py-3',
                'pr-4 font-medium tracking-wide',
                dark ? 'text-paper/80' : 'text-ink',
              )}
            >
              {day}
            </td>
            <td
              className={cn(
                compact ? 'py-2' : 'py-3',
                'text-right',
                hours === 'CLOSED'
                  ? dark
                    ? 'text-amber'
                    : 'text-amber-deep'
                  : dark
                    ? 'text-paper/50'
                    : 'text-stone',
              )}
            >
              {hours}
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}
