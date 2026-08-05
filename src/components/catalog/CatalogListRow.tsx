import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PriceLock from '@/components/PriceLock';
import { STOCK_LABEL } from '@/data/catalog';
import { cn } from '@/lib/utils';
import { STOCK_STYLES, type CatalogProduct } from './catalog-utils';

/** Dense mono table-row for the catalog list view. */
export default function CatalogListRow({ product }: { product: CatalogProduct }) {
  const caseSize = product.specs?.caseSize ?? product.unitLabel ?? 'Case';
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-3 py-3 transition-colors hover:bg-paper-2 md:grid-cols-[minmax(0,1fr)_150px_120px_130px_150px_32px] md:gap-4"
    >
      {/* Product */}
      <span className="flex min-w-0 items-center gap-3">
        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-paper-2">
          <img
            src={product.image ?? '/product-placeholder.jpg'}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold text-ink">
            {product.name}
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-stone md:hidden">
            {product.brand} · {caseSize}
          </span>
        </span>
      </span>

      {/* Brand */}
      <span className="hidden font-mono text-xs uppercase tracking-wide text-stone md:block">
        {product.brand}
      </span>
      {/* Case */}
      <span className="hidden font-mono text-xs text-stone md:block">{caseSize}</span>
      {/* Stock */}
      <span className="hidden md:block">
        <span
          className={cn(
            'inline-block rounded-full px-2.5 py-1 font-mono text-[10px] font-medium tracking-wider',
            STOCK_STYLES[product.stockStatus],
          )}
        >
          {STOCK_LABEL[product.stockStatus]}
        </span>
      </span>
      {/* Price */}
      <span className="hidden md:block">
        <PriceLock price={product.priceCents != null ? product.priceCents / 100 : 0} unit="case" />
      </span>

      <ChevronRight className="h-4 w-4 justify-self-end text-stone transition-transform duration-200 group-hover:translate-x-1 group-hover:text-amber" />
    </Link>
  );
}
