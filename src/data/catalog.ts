import {
  Cookie,
  CupSoda,
  Fuel,
  Leaf,
  Shirt,
  Sparkles,
  UtensilsCrossed,
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

export const CATEGORIES: Category[] = [
  { slug: 'vapes', name: 'Vapes', count: 142, image: '/cat-vapes.jpg', icon: Zap },
  { slug: 'tobacco-cigarillos', name: 'Tobacco & Cigarillos', count: 218, image: '/cat-tobacco.jpg', icon: Leaf },
  { slug: 'snacks-candy', name: 'Snacks & Candy', count: 386, image: '/cat-snacks.jpg', icon: Cookie },
  { slug: 'beverages', name: 'Beverages', count: 264, image: '/cat-beverages.jpg', icon: CupSoda },
  { slug: 'gas-station-supplies', name: 'Gas Station Supplies', count: 172, image: '/cat-gas-station.jpg', icon: Fuel },
  { slug: 'restaurant-supplies', name: 'Restaurant Supplies', count: 348, image: '/cat-restaurant.jpg', icon: UtensilsCrossed },
  { slug: 'health-beauty', name: 'Health & Beauty', count: 156, image: '/cat-health-beauty.jpg', icon: Sparkles },
  { slug: 'gemrock-apparel', name: 'Gemrock Apparel', count: 64, image: '/cat-apparel.jpg', icon: Shirt },
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
  { id: 'p-001', slug: 'barcel-takis-fuego-case', name: 'Takis-Style Rolled Tortilla Chips, Fuego', brand: 'BARCEL', category: 'snacks-candy', casePrice: 24.99, caseSize: 'Case of 24', stock: 'in', tags: ['best-seller'] },
  { id: 'p-002', slug: '7up-lemon-lime-12oz-case', name: 'Lemon-Lime Soda, 12oz Cans', brand: '7UP', category: 'beverages', casePrice: 18.5, caseSize: 'Case of 24', stock: 'in', tags: ['best-seller'] },
  { id: 'p-003', slug: 'mb-select-disposable-vape-5k', name: 'MB Select Disposable Vape, 5000 Puff', brand: 'MB SELECT', category: 'vapes', casePrice: 89.0, caseSize: 'Case of 10', stock: 'in', tags: ['new', 'best-seller'] },
  { id: 'p-004', slug: 'kelloggs-assorted-cereal-bowls', name: 'Assorted Cereal Single-Serve Bowls', brand: "KELLOGG'S", category: 'snacks-candy', casePrice: 21.75, caseSize: 'Case of 96', stock: 'low', tags: ['promo'] },
  { id: 'p-005', slug: 'franks-redhot-sauce-portion', name: 'Hot Sauce Portion Cups', brand: "FRANK'S REDHOT", category: 'restaurant-supplies', casePrice: 16.25, caseSize: 'Case of 200', stock: 'in', tags: ['new'] },
  { id: 'p-006', slug: 'gemrock-heavyweight-tee-black', name: 'Gemrock Heavyweight Tee — Black', brand: 'GEMROCK', category: 'gemrock-apparel', casePrice: 96.0, caseSize: 'Case of 24', stock: 'in', tags: ['promo'] },
  { id: 'p-007', slug: 'copenhagen-long-cut-roll', name: 'Long Cut Moist Snuff, 5-Can Roll', brand: 'COPENHAGEN', category: 'tobacco-cigarillos', casePrice: 42.0, caseSize: 'Case of 10 rolls', stock: 'in', tags: ['best-seller'] },
  { id: 'p-008', slug: 'mb-select-motor-oil-5w30', name: 'MB Select Motor Oil 5W-30, Quart', brand: 'MB SELECT', category: 'gas-station-supplies', casePrice: 38.4, caseSize: 'Case of 12', stock: 'low', tags: ['new', 'promo'] },
  { id: 'p-009', slug: 'tide-travel-detergent-packets', name: 'Travel-Size Laundry Detergent Packets', brand: 'TIDE', category: 'health-beauty', casePrice: 28.9, caseSize: 'Case of 156', stock: 'out', tags: ['promo'] },
];

export const STOCK_LABEL: Record<StockStatus, string> = {
  in: 'IN STOCK',
  low: 'LOW STOCK',
  out: 'OUT OF STOCK',
};

export const WAREHOUSE = {
  name: 'MB Wholesale LLC',
  address: '4414 W 30th St, Indianapolis, IN 46222',
  phone: '(317) 555-0142',
  email: 'sales@mbwholesale.com',
  hours: [
    ['MON – FRI', '7:00 AM – 6:00 PM'],
    ['SATURDAY', '8:00 AM – 4:00 PM'],
    ['SUNDAY', 'CLOSED'],
  ] as Array<[string, string]>,
  tagline: 'Quality Service. Quality Products. Quality Prices.',
};
