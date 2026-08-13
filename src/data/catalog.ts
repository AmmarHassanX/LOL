import {
  Car,
  Coffee,
  CupSoda,
  Droplet,
  Flame,
  Home,
  Package,
  Candy,
  Shirt,
  UtensilsCrossed,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface Category {
  slug: string;
  name: string;
  count: number;
  image: string;
  icon: LucideIcon;
}

/**
 * Matches the real category menu on mbwholesalellc.com (verified via
 * indexed pages of the live site — Google Maps itself can't be scraped,
 * it requires JS to render). `count` values are still illustrative
 * placeholders since no live inventory is connected yet — they're not
 * pulled from anywhere real.
 */
export const CATEGORIES: Category[] = [
  { slug: 'vape-disposable', name: 'Vape & Disposable', count: 142, image: '/cat-vapes.jpg', icon: Zap },
  { slug: 'e-liquid', name: 'E-Liquid', count: 58, image: '/cat-tobacco.jpg', icon: Droplet },
  { slug: 'smoking-accessories', name: 'Smoking Accessories', count: 218, image: '/cat-beverages.jpg', icon: Wind },
  { slug: 'rolling-papers', name: 'Rolling Papers', count: 64, image: '/cat-gas-station.jpg', icon: Package },
  { slug: 'lighters-butane', name: 'Lighters & Butane', count: 46, image: '/cat-restaurant.jpg', icon: Flame },
  { slug: 'drinks', name: 'Drinks', count: 264, image: '/cat-health-beauty.jpg', icon: CupSoda },
  { slug: 'toy-candy', name: 'Toy & Candy', count: 172, image: '/cat-apparel.jpg', icon: Candy },
  { slug: 'general-merchandise', name: 'General Merchandise', count: 386, image: '/cat-vapes.jpg', icon: Package },
  { slug: 'energy-supplement-personal-care', name: 'Energy Supplement & Personal Care', count: 156, image: '/cat-health-beauty.jpg', icon: Coffee },
  { slug: 'household-supplies', name: 'Household Supplies', count: 88, image: '/cat-restaurant.jpg', icon: Home },
  { slug: 'automotive', name: 'Automotive', count: 74, image: '/cat-gas-station.jpg', icon: Car },
  { slug: 'restaurant-supply', name: 'Restaurant Supply', count: 348, image: '/cat-restaurant.jpg', icon: UtensilsCrossed },
  { slug: 'clothing', name: 'Clothing', count: 64, image: '/cat-apparel.jpg', icon: Shirt },
];

export const BRANDS_ROW_1 = ['MARLBORO', 'NEWPORT', 'CAMEL', 'WINSTON', 'KOOL', 'COPENHAGEN', 'SKOAL', 'BARCEL'];
export const BRANDS_ROW_2 = ["KELLOGG'S", 'GENERAL MILLS', 'NESTLÉ', 'QUAKER', '7UP', 'TIDE', "FRANK'S REDHOT", 'HORMEL', 'DEL MONTE', 'GEMROCK'];

export type StockStatus = 'in' | 'low' | 'out';

export interface FeaturedProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  casePrice: number;
  caseSize: string;
  stock: StockStatus;
  image?: string;
  tags: Array<'best-seller' | 'new' | 'promo'>;
}

export const FEATURED_PRODUCTS: FeaturedProduct[] = [
  { id: 'p-001', slug: 'barcel-takis-fuego-case', name: 'Takis-Style Rolled Tortilla Chips, Fuego', brand: 'BARCEL', category: 'general-merchandise', casePrice: 24.99, caseSize: 'Case of 24', stock: 'in', tags: ['best-seller'] },
  { id: 'p-002', slug: '7up-lemon-lime-12oz-case', name: 'Lemon-Lime Soda, 12oz Cans', brand: '7UP', category: 'drinks', casePrice: 18.5, caseSize: 'Case of 24', stock: 'in', tags: ['best-seller'] },
  { id: 'p-003', slug: 'mb-select-disposable-vape-5k', name: 'MB Select Disposable Vape, 5000 Puff', brand: 'MB SELECT', category: 'vape-disposable', casePrice: 89.0, caseSize: 'Case of 10', stock: 'in', tags: ['new', 'best-seller'] },
  { id: 'p-004', slug: 'kelloggs-assorted-cereal-bowls', name: 'Assorted Cereal Single-Serve Bowls', brand: "KELLOGG'S", category: 'general-merchandise', casePrice: 21.75, caseSize: 'Case of 96', stock: 'low', tags: ['promo'] },
  { id: 'p-005', slug: 'franks-redhot-sauce-portion', name: 'Hot Sauce Portion Cups', brand: "FRANK'S REDHOT", category: 'restaurant-supply', casePrice: 16.25, caseSize: 'Case of 200', stock: 'in', tags: ['new'] },
  { id: 'p-006', slug: 'gemrock-heavyweight-tee-black', name: 'Gemrock Heavyweight Tee — Black', brand: 'GEMROCK', category: 'clothing', casePrice: 96.0, caseSize: 'Case of 24', stock: 'in', tags: ['promo'] },
  { id: 'p-007', slug: 'copenhagen-long-cut-roll', name: 'Long Cut Moist Snuff, 5-Can Roll', brand: 'COPENHAGEN', category: 'smoking-accessories', casePrice: 42.0, caseSize: 'Case of 10 rolls', stock: 'in', tags: ['best-seller'] },
  { id: 'p-008', slug: 'mb-select-motor-oil-5w30', name: 'MB Select Motor Oil 5W-30, Quart', brand: 'MB SELECT', category: 'automotive', casePrice: 38.4, caseSize: 'Case of 12', stock: 'low', tags: ['new', 'promo'] },
  { id: 'p-009', slug: 'tide-travel-detergent-packets', name: 'Travel-Size Laundry Detergent Packets', brand: 'TIDE', category: 'household-supplies', casePrice: 28.9, caseSize: 'Case of 156', stock: 'out', tags: ['promo'] },
];

export const STOCK_LABEL: Record<StockStatus, string> = {
  in: 'IN STOCK',
  low: 'LOW STOCK',
  out: 'OUT OF STOCK',
};

/** Verified from mbwholesalellc.com and Indiana DOR licensing records —
 *  this address is their customer-facing warehouse (the DOR filing also
 *  lists a separate 4414 W 30th St as a mailing address on the same
 *  license, which is why an earlier pass had the wrong one here). */
export const WAREHOUSE = {
  name: 'MB Wholesale LLC',
  address: '4935 W 38th St, Indianapolis, IN 46254',
  phone: '(317) 803-9060',
  email: 'sales@mbwholesalellc.com',
  hours: [
    ['MON – SAT', '9:30 AM – 8:00 PM'],
    ['SUNDAY', '10:30 AM – 6:00 PM'],
  ] as Array<[string, string]>,
  tagline: 'Quality Service. Quality Products. Quality Prices.',
};

