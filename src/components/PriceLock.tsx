import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { LOGIN_PATH } from '@/const';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface PriceLockProps {
  /** Wholesale price per case (only revealed to authenticated customers) */
  price?: number;
  /** Unit label, e.g. "case" */
  unit?: string;
  /** sm = card, lg = product detail */
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * THE signature gated-pricing component.
 * Guests see an amber-soft lock pill linking to sign-in; authenticated
 * customers see the real wholesale price. Swaps with a layout animation.
 */
export default function PriceLock({ price = 0, unit = 'case', size = 'sm', className }: PriceLockProps) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className={cn('inline-flex', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden
            className={cn(
              'inline-block animate-pulse rounded-full bg-paper-2',
              size === 'lg' ? 'h-9 w-32' : 'h-7 w-24',
            )}
          />
        ) : isAuthenticated ? (
          <motion.div
            key="price"
            layout="position"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-baseline gap-1.5"
          >
            <span className={cn('font-display font-bold text-amber', size === 'lg' ? 'text-3xl' : 'text-lg')}>
              $
            </span>
            <span
              className={cn(
                'font-display font-bold tracking-tight text-ink',
                size === 'lg' ? 'text-3xl' : 'text-lg',
              )}
            >
              {price.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-stone">/ {unit}</span>
          </motion.div>
        ) : (
          <motion.div
            key="lock"
            layout="position"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Link
              to={LOGIN_PATH}
              title="Wholesale pricing is available to registered customers."
              className={cn(
                'group inline-flex items-center gap-1.5 rounded-full bg-amber-soft font-mono font-medium text-amber-deep transition-colors hover:bg-amber hover:text-paper',
                size === 'lg' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-[11px] tracking-wide',
              )}
            >
              <Lock className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} strokeWidth={2.5} />
              SIGN IN FOR PRICE
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
