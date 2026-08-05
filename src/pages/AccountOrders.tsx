import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AccountShell from '@/components/account/AccountShell';
import StatusChip from '@/components/account/StatusChip';
import { cn } from '@/lib/utils';
import {
  formatDate,
  formatMoney,
  isOpenOrder,
  toDate,
} from '@/components/account/utils';
import type { OrderSummary } from '@/components/account/utils';

type StatusFilter = 'all' | 'open' | 'delivered' | 'cancelled';
type RangeFilter = '30d' | '90d' | '1yr' | 'all';

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 10;

function rangeCutoff(range: RangeFilter): Date | null {
  const now = new Date();
  switch (range) {
    case '30d':
      return new Date(now.getTime() - 30 * 86400_000);
    case '90d':
      return new Date(now.getTime() - 90 * 86400_000);
    case '1yr':
      return new Date(now.getTime() - 365 * 86400_000);
    default:
      return null;
  }
}

function matchesStatus(order: OrderSummary, filter: StatusFilter): boolean {
  switch (filter) {
    case 'open':
      return isOpenOrder(order.status);
    case 'delivered':
      return order.status === 'delivered';
    case 'cancelled':
      // The 5-step flow has no cancelled state yet — chip kept for parity with the manifest UI.
      return (order.status as string) === 'cancelled';
    default:
      return true;
  }
}

function OrdersTable() {
  const navigate = useNavigate();
  const ordersQuery = trpc.orders.mine.useQuery();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [range, setRange] = useState<RangeFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const filtered = useMemo(() => {
    const cutoff = rangeCutoff(range);
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesStatus(order, statusFilter)) return false;
      if (cutoff) {
        const placed = toDate(order.placedAt);
        if (!placed || placed < cutoff) return false;
      }
      if (q && !order.orderNo.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, statusFilter, range, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div>
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// ORDER MANIFEST</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
        Order History
      </h1>
      <p className="mt-1.5 font-mono text-[11px] tracking-wider text-stone">
        {orders.length} ORDERS ON RECORD
      </p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatusFilter(f.key);
                resetPage();
              }}
              className={cn(
                'rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-wider transition-colors',
                statusFilter === f.key
                  ? 'border-amber bg-amber text-paper'
                  : 'border-line bg-paper text-stone hover:border-amber/50 hover:text-ink',
              )}
            >
              {f.label.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Search order # (MB-2026-…)"
            className="border-line bg-paper pl-9 font-mono text-sm placeholder:text-stone/60"
          />
        </div>
        <Select
          value={range}
          onValueChange={(v) => {
            setRange(v as RangeFilter);
            resetPage();
          }}
        >
          <SelectTrigger className="w-36 border-line bg-paper font-mono text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1yr">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {ordersQuery.isLoading ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-line bg-paper-2/50 px-6 py-16 text-center">
          <Package className="h-10 w-10 text-stone" />
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            {orders.length === 0 ? 'No orders yet' : 'No orders match these filters'}
          </p>
          <p className="mt-1 max-w-sm text-sm text-stone">
            {orders.length === 0
              ? 'Stock your shelves with wholesale pricing across 8 categories.'
              : 'Try a different status, date range, or order number.'}
          </p>
          {orders.length === 0 && (
            <Button asChild className="mt-6 bg-amber text-paper hover:bg-amber-deep">
              <Link to="/products">Browse Catalog</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-paper">
            <Table>
              <TableHeader>
                <TableRow className="border-line hover:bg-transparent">
                  {['ORDER #', 'DATE', 'ITEMS', 'TOTAL', 'STATUS', ''].map((h) => (
                    <TableHead
                      key={h}
                      className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.18em] text-stone"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false} mode="popLayout">
                  {pageRows.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.03, ease: 'easeOut' }}
                      onClick={() => navigate(`/account/orders/${order.id}`)}
                      className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-paper-2"
                    >
                      <TableCell className="px-5 py-4 font-mono text-sm font-bold text-ink">
                        {order.orderNo}
                      </TableCell>
                      <TableCell className="px-5 py-4 font-mono text-[13px] text-stone">
                        {formatDate(order.placedAt)}
                      </TableCell>
                      <TableCell className="px-5 py-4 font-mono text-[13px] text-stone">
                        {order.totalQty} CASES / {order.itemCount} SKUS
                      </TableCell>
                      <TableCell className="px-5 py-4 font-mono text-sm font-bold text-ink">
                        {formatMoney(order.totalCents)}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <StatusChip status={order.status} />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-stone" />
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="font-mono text-[11px] tracking-wider text-stone">
              PAGE {safePage} OF {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-line"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-line"
                disabled={safePage >= pageCount}
                onClick={() => setPage(safePage + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AccountOrders() {
  return (
    <AccountShell>
      <OrdersTable />
    </AccountShell>
  );
}
