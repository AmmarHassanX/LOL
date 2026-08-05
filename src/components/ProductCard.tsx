import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import PriceLock from '@/components/PriceLock';
import { LOGIN_PATH } from '@/const';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cart';
import { STOCK_LABEL, type FeaturedProduct } from '@/data/catalog';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: FeaturedProduct;
  className?: string;
}

const STOCK_STYLES: Record<FeaturedProduct['stock'], string> = {
  in: 'bg-forest/10 text-forest',
  low: 'bg-amber-soft text-amber-deep',
  out: 'bg-stone/10 text-stone',
};

/** Shared product card — home, catalog, related. */
export default function ProductCard({ product, className }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const navigate = useNavigate();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(LOGIN_PATH);
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.image ?? '/product-placeholder.jpg',
      casePrice: product.casePrice,
      caseSize: product.caseSize,
    });
    openDrawer();
  };

  return (
    <motion.div layout whileHover={{ y: -4 }} transition={{ duration: 0.3, ease: 'easeOut' }} className={className}>
      <Link
        to={`/products/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-paper transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
          <img
            src={product.image ?? '/product-placeholder.jpg'}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <span
            className={cn(
              'absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium tracking-wider',
              STOCK_STYLES[product.stock],
            )}
          >
            {STOCK_LABEL[product.stock]}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <span className="font-mono text-[11px] tracking-wide text-stone">{product.brand}</span>
          <h4 className="line-clamp-2 font-display text-base font-semibold leading-snug text-ink">
            {product.name}
          </h4>

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex flex-col gap-1.5">
              <PriceLock price={product.casePrice} unit="case" />
              <span className="font-mono text-[10px] uppercase tracking-wide text-stone">
                {product.caseSize}
              </span>
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleAdd}
                disabled={product.stock === 'out'}
                className="flex h-9 items-center gap-1 rounded-lg bg-amber px-3 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-stone/40 md:opacity-0 md:group-hover:opacity-100"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add
              </button>
            ) : (
              <Link
                to={LOGIN_PATH}
                onClick={(e) => e.stopPropagation()}
                className="flex h-9 items-center rounded-lg border border-amber px-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-deep transition-colors duration-150 hover:bg-amber hover:text-paper"
              >
                Sign in to Order
              </Link>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
