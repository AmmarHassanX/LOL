import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  /** Product id / slug reference */
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image?: string;
  /** wholesale price per case (0 when unknown / guest) */
  casePrice: number;
  caseSize: string;
  /** number of cases */
  qty: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'mb-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Total number of cases in cart */
export const useCartCount = () => useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));

/** Cart subtotal in dollars */
export const useCartSubtotal = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.casePrice * i.qty, 0));
