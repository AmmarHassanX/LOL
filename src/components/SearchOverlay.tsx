import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Tag, Layers, Clock, CornerDownLeft } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { rankByRelevance } from '@contracts/search';

const RECENT_KEY = 'mbw-recent-searches';
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(term: string) {
  try {
    const next = [term, ...getRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(
      0,
      MAX_RECENT,
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing etc.) — recents just won't persist.
  }
}

/** Wraps the substring of `text` matching `query` in a <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-brand-accent-soft text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

type FlatItem =
  | { kind: 'product'; id: number; label: string; sublabel: string; href: string }
  | { kind: 'brand'; label: string; href: string }
  | { kind: 'category'; label: string; href: string }
  | { kind: 'recent'; label: string; href: string };

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus after the open animation's first frame so it reliably takes.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const suggestQuery = trpc.products.suggest.useQuery(
    { q: debounced },
    { enabled: debounced.length > 0, staleTime: 30_000, retry: false },
  );

  // Re-rank the small server result set client-side for an instantly-responsive
  // feel as the debounce window closes, using the same scoring the server used.
  const rankedProducts = useMemo(() => {
    const products = suggestQuery.data?.products ?? [];
    if (!debounced) return [];
    return rankByRelevance(
      products.map((p) => ({ ...p, subcategory: p.subcategory ?? undefined, description: p.description ?? undefined })),
      debounced,
    );
  }, [suggestQuery.data, debounced]);

  const items: FlatItem[] = useMemo(() => {
    if (!debounced) {
      return getRecent().map((term) => ({ kind: 'recent', label: term, href: `/products?search=${encodeURIComponent(term)}` }));
    }
    const productItems: FlatItem[] = rankedProducts.map((p) => ({
      kind: 'product',
      id: p.id,
      label: p.name,
      sublabel: `${p.brand} · ${p.category}`,
      href: `/products/${p.slug}`,
    }));
    const brandItems: FlatItem[] = (suggestQuery.data?.brands ?? []).map((b) => ({
      kind: 'brand',
      label: b,
      href: `/products?brand=${encodeURIComponent(b)}`,
    }));
    const categoryItems: FlatItem[] = (suggestQuery.data?.categories ?? []).map((c) => ({
      kind: 'category',
      label: c,
      href: `/products?category=${encodeURIComponent(c)}`,
    }));
    return [...productItems, ...brandItems, ...categoryItems];
  }, [debounced, rankedProducts, suggestQuery.data]);

  useEffect(() => setActiveIndex(0), [items.length, debounced]);

  const commit = (term: string) => {
    if (!term.trim()) return;
    pushRecent(term.trim());
  };

  const goTo = (href: string, term?: string) => {
    if (term) commit(term);
    navigate(href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const active = items[activeIndex];
      if (active) {
        goTo(active.href, active.kind === 'recent' ? undefined : query);
      } else if (query.trim()) {
        goTo(`/products?search=${encodeURIComponent(query.trim())}`, query);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/50 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search className="h-[18px] w-[18px] shrink-0 text-stone" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, brands, categories…"
                className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-stone hover:bg-paper-2 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              {!debounced && items.length > 0 && (
                <div className="px-2">
                  <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-stone">Recent</p>
                  {items.map((item, i) => (
                    <ResultRow key={`recent-${item.label}`} item={item} query={query} active={i === activeIndex} onClick={() => goTo(item.href)} />
                  ))}
                </div>
              )}

              {debounced && suggestQuery.isFetching && items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-stone">Searching…</p>
              )}

              {debounced && suggestQuery.isError && (
                <p className="px-4 py-8 text-center text-sm text-stone">
                  Search is temporarily unavailable. Try again in a moment.
                </p>
              )}

              {debounced && !suggestQuery.isFetching && !suggestQuery.isError && items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-stone">
                  No matches for &ldquo;{debounced}&rdquo;. Try a different word or check the spelling.
                </p>
              )}

              {debounced && items.length > 0 && (
                <div className="px-2">
                  {items.map((item, i) => (
                    <ResultRow
                      key={`${item.kind}-${item.label}`}
                      item={item}
                      query={query}
                      active={i === activeIndex}
                      onClick={() => goTo(item.href, query)}
                    />
                  ))}
                </div>
              )}
            </div>

            {debounced && (
              <button
                type="button"
                onClick={() => goTo(`/products?search=${encodeURIComponent(debounced)}`, debounced)}
                className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-left text-sm font-medium text-brand-accent transition-colors hover:bg-paper-2"
              >
                View all results for &ldquo;{debounced}&rdquo;
                <CornerDownLeft className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ResultRow({
  item,
  query,
  active,
  onClick,
}: {
  item: FlatItem;
  query: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.kind === 'brand' ? Tag : item.kind === 'category' ? Layers : item.kind === 'recent' ? Clock : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-amber-soft' : 'hover:bg-paper-2'
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-stone" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">
          <Highlight text={item.label} query={query} />
        </span>
        {item.kind === 'product' && <span className="block truncate text-xs text-stone">{item.sublabel}</span>}
      </span>
      {item.kind !== 'recent' && (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-stone">
          {item.kind === 'product' ? 'Product' : item.kind}
        </span>
      )}
    </button>
  );
}
