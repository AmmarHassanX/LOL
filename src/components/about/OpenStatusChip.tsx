import { cn } from '@/lib/utils';
import { useOpenStatus } from './hours';

/**
 * Live "Open now / Closed" chip computed from current time in
 * America/Indiana/Indianapolis. Forest when open, amber when closed.
 */
export default function OpenStatusChip({
  dark = false,
  showNote = true,
  className,
}: {
  dark?: boolean;
  showNote?: boolean;
  className?: string;
}) {
  const { open, note } = useOpenStatus();

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-2.5 gap-y-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.14em]',
          open
            ? dark
              ? 'bg-forest/30 text-[#9CD6AB]'
              : 'bg-forest/10 text-forest'
            : 'bg-amber-soft text-amber-deep',
        )}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping',
              open ? 'bg-forest' : 'bg-amber',
            )}
          />
          <span
            className={cn('relative inline-flex h-2 w-2 rounded-full', open ? 'bg-forest' : 'bg-amber')}
          />
        </span>
        {open ? 'OPEN NOW' : 'CLOSED'}
      </span>
      {showNote && note && (
        <span className={cn('font-mono text-[11px] tracking-wide', dark ? 'text-paper/50' : 'text-stone')}>
          {note}
        </span>
      )}
    </span>
  );
}
