import { cn } from '@/lib/utils';
import { statusLabel } from './utils';

const CHIP_CLASSES: Record<string, string> = {
  out_for_delivery: 'border-amber/40 bg-amber-soft text-amber-deep',
  delivered: 'border-forest/30 bg-forest/10 text-forest',
  placed: 'border-line bg-paper-2 text-stone',
  confirmed: 'border-line bg-paper-2 text-stone',
  picked: 'border-line bg-paper-2 text-stone',
};

export default function StatusChip({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.12em] whitespace-nowrap',
        CHIP_CLASSES[status] ?? 'border-line bg-paper-2 text-stone',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'delivered' && 'bg-forest',
          status === 'out_for_delivery' && 'bg-amber',
          status !== 'delivered' && status !== 'out_for_delivery' && 'bg-stone',
        )}
      />
      {statusLabel(status)}
    </span>
  );
}
