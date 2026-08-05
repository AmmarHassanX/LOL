import { getDb } from "../api/queries/connection";
import { products, type InsertProduct, type ProductCategory, type StockStatus, type ProductTag } from "./schema";

const CATEGORY_IMAGE: Record<ProductCategory, string> = {
  Vapes: "/cat-vapes.jpg",
  "Tobacco & Cigarillos": "/cat-tobacco.jpg",
  "Snacks & Candy": "/cat-snacks.jpg",
  Beverages: "/cat-beverages.jpg",
  "Gas Station Supplies": "/cat-gas-station.jpg",
  "Restaurant Supplies": "/cat-restaurant.jpg",
  "Health & Beauty": "/cat-health-beauty.jpg",
  "Gemrock Apparel": "/cat-apparel.jpg",
};

type SeedSpec = {
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory?: string;
  description: string;
  caseSize: string; // e.g. "Case of 24"
  unitCount: number;
  priceCents: number;
  stock: StockStatus;
  tags?: ProductTag[];
  sku: string;
};

function toRow(p: SeedSpec): InsertProduct {
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory ?? null,
    description: p.description,
    specs: { caseSize: p.caseSize, sku: p.sku, unitCount: p.unitCount },
    priceCents: p.priceCents,
    unitLabel: p.caseSize.toLowerCase(),
    stockStatus: p.stock,
    image: CATEGORY_IMAGE[p.category],
    tags: p.tags ?? [],
  };
}

const CATALOG: SeedSpec[] = [
  // ── Vapes ──────────────────────────────────────────────────────────────
  { slug: "mb-select-disposable-vape-5k", name: "MB Select Disposable Vape, 5000 Puff", brand: "MB Select", category: "Vapes", subcategory: "Disposables", description: "House-label 5000-puff disposable vape, assorted top-selling flavors. Counter display box included.", caseSize: "Case of 10", unitCount: 10, priceCents: 8900, stock: "in", tags: ["new", "best-seller"], sku: "MB-VP-5000" },
  { slug: "mb-select-disposable-vape-8k", name: "MB Select Disposable Vape, 8000 Puff", brand: "MB Select", category: "Vapes", subcategory: "Disposables", description: "High-capacity 8000-puff disposable with rechargeable battery. Assorted flavors per case.", caseSize: "Case of 10", unitCount: 10, priceCents: 11900, stock: "in", tags: ["new"], sku: "MB-VP-8000" },
  { slug: "mb-select-pod-system-kit", name: "MB Select Pod System Starter Kit", brand: "MB Select", category: "Vapes", subcategory: "Pod Systems", description: "Refillable pod system starter kit with USB-C charging. Includes device, 2 pods, and cable.", caseSize: "Case of 12", unitCount: 12, priceCents: 9600, stock: "low", sku: "MB-VP-PODKIT" },
  { slug: "mb-select-replacement-pods", name: "MB Select Replacement Pods, 2-Pack", brand: "MB Select", category: "Vapes", subcategory: "Pods & Coils", description: "Replacement pods for MB Select pod systems, 2 per retail pack.", caseSize: "Case of 50", unitCount: 50, priceCents: 12500, stock: "in", sku: "MB-VP-PODS2" },
  { slug: "mb-select-vape-juice-30ml", name: "MB Select E-Liquid, 30ml Bottle", brand: "MB Select", category: "Vapes", subcategory: "E-Liquid", description: "30ml bottled e-liquid in assorted nicotine strengths and flavors.", caseSize: "Case of 25", unitCount: 25, priceCents: 8750, stock: "in", tags: ["promo"], sku: "MB-VP-EJU30" },
  { slug: "mb-select-vape-display-combo", name: "MB Select Counter Display Combo Pack", brand: "MB Select", category: "Vapes", subcategory: "Disposables", description: "Mixed best-seller disposable combo with acrylic counter display for c-store counters.", caseSize: "Case of 24", unitCount: 24, priceCents: 16800, stock: "low", tags: ["best-seller"], sku: "MB-VP-COMBO" },
  { slug: "gemrock-vape-lanyard-bundle", name: "Gemrock Vape Lanyard & Case Bundle", brand: "Gemrock", category: "Vapes", subcategory: "Accessories", description: "Branded lanyard and silicone device case bundle for pod systems.", caseSize: "Case of 48", unitCount: 48, priceCents: 5760, stock: "out", sku: "GR-VP-LNYD" },

  // ── Tobacco & Cigarillos ───────────────────────────────────────────────
  { slug: "marlboro-red-king-box-carton", name: "Red King Box Cigarettes, Carton", brand: "Marlboro", category: "Tobacco & Cigarillos", subcategory: "Cigarettes", description: "Full-flavor king box cigarettes, 10 packs per carton. Adult-use, 21+.", caseSize: "Case of 10 cartons", unitCount: 10, priceCents: 84500, stock: "in", tags: ["best-seller"], sku: "MAR-RED-KB" },
  { slug: "marlboro-gold-king-box-carton", name: "Gold King Box Cigarettes, Carton", brand: "Marlboro", category: "Tobacco & Cigarillos", subcategory: "Cigarettes", description: "Light king box cigarettes, 10 packs per carton. Adult-use, 21+.", caseSize: "Case of 10 cartons", unitCount: 10, priceCents: 84500, stock: "in", sku: "MAR-GLD-KB" },
  { slug: "newport-menthol-king-carton", name: "Menthol King Box Cigarettes, Carton", brand: "Newport", category: "Tobacco & Cigarillos", subcategory: "Cigarettes", description: "Menthol king box cigarettes, 10 packs per carton. Adult-use, 21+.", caseSize: "Case of 10 cartons", unitCount: 10, priceCents: 86200, stock: "in", tags: ["best-seller"], sku: "NPT-MEN-KB" },
  { slug: "newport-menthol-100s-carton", name: "Menthol 100s Box Cigarettes, Carton", brand: "Newport", category: "Tobacco & Cigarillos", subcategory: "Cigarettes", description: "Menthol 100s box cigarettes, 10 packs per carton. Adult-use, 21+.", caseSize: "Case of 10 cartons", unitCount: 10, priceCents: 86200, stock: "low", sku: "NPT-MEN-100" },
  { slug: "camel-blue-king-box-carton", name: "Blue King Box Cigarettes, Carton", brand: "Camel", category: "Tobacco & Cigarillos", subcategory: "Cigarettes", description: "Smooth light king box cigarettes, 10 packs per carton. Adult-use, 21+.", caseSize: "Case of 10 cartons", unitCount: 10, priceCents: 82800, stock: "in", sku: "CAM-BLU-KB" },
  { slug: "camel-filters-king-carton", name: "Filters King Box Cigarettes, Carton", brand: "Camel", category: "Tobacco & Cigarillos", subcategory: "Cigarettes", description: "Classic full-flavor filter cigarettes, 10 packs per carton. Adult-use, 21+.", caseSize: "Case of 10 cartons", unitCount: 10, priceCents: 82800, stock: "in", sku: "CAM-FIL-KB" },
  { slug: "winston-red-king-box-carton", name: "Red King Box Cigarettes, Carton", brand: "Winston", category: "Tobacco & Cigarillos", subcategory: "Cigarettes", description: "Full-flavor king box cigarettes, 10 packs per carton. Adult-use, 21+.", caseSize: "Case of 10 cartons", unitCount: 10, priceCents: 79600, stock: "low", sku: "WIN-RED-KB" },
  { slug: "kool-menthol-king-carton", name: "Menthol King Box Cigarettes, Carton", brand: "Kool", category: "Tobacco & Cigarillos", subcategory: "Cigarettes", description: "Menthol king box cigarettes, 10 packs per carton. Adult-use, 21+.", caseSize: "Case of 10 cartons", unitCount: 10, priceCents: 77400, stock: "out", sku: "KOL-MEN-KB" },
  { slug: "copenhagen-long-cut-5can-roll", name: "Long Cut Moist Snuff, 5-Can Roll", brand: "Copenhagen", category: "Tobacco & Cigarillos", subcategory: "Smokeless", description: "Original long cut moist snuff, 5-can roll. Adult-use, 21+.", caseSize: "Case of 10 rolls", unitCount: 50, priceCents: 42000, stock: "in", tags: ["best-seller"], sku: "CPH-LC-5RL" },
  { slug: "copenhagen-wintergreen-5can-roll", name: "Wintergreen Long Cut, 5-Can Roll", brand: "Copenhagen", category: "Tobacco & Cigarillos", subcategory: "Smokeless", description: "Wintergreen long cut moist snuff, 5-can roll. Adult-use, 21+.", caseSize: "Case of 10 rolls", unitCount: 50, priceCents: 42000, stock: "in", sku: "CPH-WG-5RL" },
  { slug: "skoal-classic-wintergreen-5can-roll", name: "Classic Wintergreen, 5-Can Roll", brand: "Skoal", category: "Tobacco & Cigarillos", subcategory: "Smokeless", description: "Classic wintergreen moist snuff, 5-can roll. Adult-use, 21+.", caseSize: "Case of 10 rolls", unitCount: 50, priceCents: 38900, stock: "low", tags: ["promo"], sku: "SKL-WG-5RL" },
  { slug: "mb-select-cigarillos-grape-2pk", name: "MB Select Cigarillos, Grape 2-Pack", brand: "MB Select", category: "Tobacco & Cigarillos", subcategory: "Cigarillos", description: "Foil-fresh grape cigarillos, 2 per pack. Adult-use, 21+.", caseSize: "Case of 30 packs", unitCount: 30, priceCents: 13500, stock: "in", tags: ["new"], sku: "MB-CG-GRP2" },

  // ── Snacks & Candy ─────────────────────────────────────────────────────
  { slug: "barcel-takis-fuego-case", name: "Takis-Style Rolled Tortilla Chips, Fuego", brand: "Barcel", category: "Snacks & Candy", subcategory: "Chips", description: "Hot chili-lime rolled tortilla chips, 4oz grab bags for c-store racks.", caseSize: "Case of 24", unitCount: 24, priceCents: 2499, stock: "in", tags: ["best-seller"], sku: "BAR-TAK-FGO" },
  { slug: "kelloggs-assorted-cereal-bowls", name: "Assorted Single-Serve Cereal Bowls", brand: "Kellogg's", category: "Snacks & Candy", subcategory: "Cereal", description: "Single-serve cereal bowls, assorted top varieties for grab-and-go.", caseSize: "Case of 96", unitCount: 96, priceCents: 2175, stock: "low", tags: ["promo"], sku: "KEL-CER-BWL" },
  { slug: "kelloggs-pop-tarts-variety", name: "Toaster Pastries, Variety Pack", brand: "Kellogg's", category: "Snacks & Candy", subcategory: "Pastries", description: "Twin-pack toaster pastries in frosted strawberry, brown sugar, and s'mores.", caseSize: "Case of 72", unitCount: 72, priceCents: 3840, stock: "in", sku: "KEL-PT-VAR" },
  { slug: "general-mills-cereal-bars", name: "Cereal Breakfast Bars, Assorted", brand: "General Mills", category: "Snacks & Candy", subcategory: "Breakfast Bars", description: "Assorted cereal breakfast bars — cinnamon, oats & honey, strawberry.", caseSize: "Case of 96", unitCount: 96, priceCents: 4320, stock: "in", sku: "GMI-CER-BAR" },
  { slug: "nestle-candy-variety-mix", name: "Chocolate Candy Variety Mix", brand: "Nestlé", category: "Snacks & Candy", subcategory: "Candy", description: "Assorted full-size chocolate bars for checkout-lane display.", caseSize: "Case of 48", unitCount: 48, priceCents: 5280, stock: "in", tags: ["best-seller"], sku: "NES-CDY-MIX" },
  { slug: "post-single-serve-cereal-cups", name: "Single-Serve Cereal Cups, Assorted", brand: "Post", category: "Snacks & Candy", subcategory: "Cereal", description: "Single-serve cereal cups in assorted classic varieties.", caseSize: "Case of 60", unitCount: 60, priceCents: 2700, stock: "out", sku: "PST-CER-CUP" },
  { slug: "quaker-granola-bars-variety", name: "Chewy Granola Bars, Variety Pack", brand: "Quaker", category: "Snacks & Candy", subcategory: "Granola Bars", description: "Chewy granola bars — chocolate chip, peanut butter, s'mores.", caseSize: "Case of 60", unitCount: 60, priceCents: 3300, stock: "in", sku: "QUA-GRN-VAR" },
  { slug: "mb-select-trail-mix-bags", name: "MB Select Trail Mix, 3oz Bags", brand: "MB Select", category: "Snacks & Candy", subcategory: "Nuts & Mixes", description: "House-label trail mix with peanuts, raisins, and chocolate candies.", caseSize: "Case of 36", unitCount: 36, priceCents: 1980, stock: "in", tags: ["new", "promo"], sku: "MB-SNK-TRL" },

  // ── Beverages ──────────────────────────────────────────────────────────
  { slug: "7up-lemon-lime-12oz-cans", name: "Lemon-Lime Soda, 12oz Cans", brand: "7UP", category: "Beverages", subcategory: "Soda", description: "Classic lemon-lime soda in 12oz cans, fridge-pack cases.", caseSize: "Case of 24", unitCount: 24, priceCents: 1850, stock: "in", tags: ["best-seller"], sku: "7UP-LL-12C" },
  { slug: "7up-cherry-20oz-bottles", name: "Cherry Soda, 20oz Bottles", brand: "7UP", category: "Beverages", subcategory: "Soda", description: "Cherry-flavored lemon-lime soda in 20oz single-serve bottles.", caseSize: "Case of 24", unitCount: 24, priceCents: 2160, stock: "low", sku: "7UP-CH-20B" },
  { slug: "mb-select-purified-water-16oz", name: "MB Select Purified Water, 16.9oz", brand: "MB Select", category: "Beverages", subcategory: "Water", description: "House-label purified drinking water bottles for cooler doors.", caseSize: "Case of 24", unitCount: 24, priceCents: 480, stock: "in", tags: ["promo"], sku: "MB-BV-WTR16" },
  { slug: "mb-select-energy-drink-16oz", name: "MB Select Energy Drink, 16oz", brand: "MB Select", category: "Beverages", subcategory: "Energy", description: "House-label energy drink, original and sugar-free assorted per case.", caseSize: "Case of 24", unitCount: 24, priceCents: 2880, stock: "in", tags: ["new", "best-seller"], sku: "MB-BV-EN16" },
  { slug: "del-monte-100-juice-variety", name: "100% Juice, Single-Serve Variety", brand: "Del Monte", category: "Beverages", subcategory: "Juice", description: "Single-serve 100% juice bottles — orange, apple, fruit punch.", caseSize: "Case of 24", unitCount: 24, priceCents: 1920, stock: "in", sku: "DEL-JC-VAR" },
  { slug: "nestle-coffee-creamer-singles", name: "Coffee Creamer Singles, Shelf-Stable", brand: "Nestlé", category: "Beverages", subcategory: "Coffee", description: "Shelf-stable liquid creamer singles for coffee counters, original & french vanilla.", caseSize: "Case of 180", unitCount: 180, priceCents: 2340, stock: "low", sku: "NES-CRM-SGL" },
  { slug: "mb-select-iced-tea-23oz", name: "MB Select Iced Tea, 23oz Cans", brand: "MB Select", category: "Beverages", subcategory: "Tea", description: "House-label sweet iced tea in 23oz cans, lemon and peach assorted.", caseSize: "Case of 24", unitCount: 24, priceCents: 1440, stock: "out", sku: "MB-BV-TEA23" },

  // ── Gas Station Supplies ───────────────────────────────────────────────
  { slug: "mb-select-motor-oil-5w30-quarts", name: "MB Select Motor Oil 5W-30, Quart", brand: "MB Select", category: "Gas Station Supplies", subcategory: "Automotive", description: "House-label 5W-30 motor oil in quart bottles for service-island racks.", caseSize: "Case of 12", unitCount: 12, priceCents: 3840, stock: "low", tags: ["new", "promo"], sku: "MB-GS-OIL530" },
  { slug: "mb-select-washer-fluid-gal", name: "MB Select Windshield Washer Fluid, 1 Gal", brand: "MB Select", category: "Gas Station Supplies", subcategory: "Automotive", description: "All-season windshield washer fluid, gallon jugs.", caseSize: "Case of 6", unitCount: 6, priceCents: 990, stock: "in", sku: "MB-GS-WSH1G" },
  { slug: "mb-select-air-freshener-cards", name: "MB Select Air Freshener Cards, Assorted", brand: "MB Select", category: "Gas Station Supplies", subcategory: "Automotive", description: "Hanging cardboard air fresheners in assorted scents for peg hooks.", caseSize: "Case of 72", unitCount: 72, priceCents: 2160, stock: "in", sku: "MB-GS-AFR72" },
  { slug: "mb-select-disposable-lighters", name: "MB Select Disposable Lighters", brand: "MB Select", category: "Gas Station Supplies", subcategory: "Counter Items", description: "Child-resistant disposable lighters with counter display tray. 21+ where applicable.", caseSize: "Case of 50", unitCount: 50, priceCents: 2450, stock: "in", tags: ["best-seller"], sku: "MB-GS-LTR50" },
  { slug: "mb-select-usb-c-car-chargers", name: "MB Select USB-C Car Chargers", brand: "MB Select", category: "Gas Station Supplies", subcategory: "Electronics", description: "Dual-port USB-C car chargers in blister packs.", caseSize: "Case of 24", unitCount: 24, priceCents: 4320, stock: "low", sku: "MB-GS-USBC24" },
  { slug: "mb-select-work-gloves-pairs", name: "MB Select Work Gloves, Assorted Sizes", brand: "MB Select", category: "Gas Station Supplies", subcategory: "Automotive", description: "Canvas and knit work gloves for pump islands and garages.", caseSize: "Case of 24 pairs", unitCount: 24, priceCents: 2880, stock: "in", sku: "MB-GS-GLV24" },
  { slug: "mb-select-rain-ponchos", name: "MB Select Emergency Rain Ponchos", brand: "MB Select", category: "Gas Station Supplies", subcategory: "Counter Items", description: "One-size disposable rain ponchos in sealed packs.", caseSize: "Case of 48", unitCount: 48, priceCents: 2400, stock: "out", tags: ["promo"], sku: "MB-GS-PON48" },

  // ── Restaurant Supplies ────────────────────────────────────────────────
  { slug: "franks-redhot-portion-cups", name: "Hot Sauce Portion Cups", brand: "Frank's RedHot", category: "Restaurant Supplies", subcategory: "Condiments", description: "Original cayenne hot sauce in single-serve portion cups for takeout bags.", caseSize: "Case of 200", unitCount: 200, priceCents: 1625, stock: "in", tags: ["new"], sku: "FRH-PC-200" },
  { slug: "franks-redhot-12oz-bottles", name: "Original Hot Sauce, 12oz Bottles", brand: "Frank's RedHot", category: "Restaurant Supplies", subcategory: "Condiments", description: "Back-of-house 12oz bottles for kitchen and table service.", caseSize: "Case of 12", unitCount: 12, priceCents: 2340, stock: "in", sku: "FRH-12OZ-12" },
  { slug: "hormel-bacon-bits-20oz", name: "Real Bacon Bits, 20oz Pouches", brand: "Hormel", category: "Restaurant Supplies", subcategory: "Pantry", description: "Fully cooked real bacon bits for salad bars, pizza, and toppings.", caseSize: "Case of 6", unitCount: 6, priceCents: 4140, stock: "in", sku: "HOR-BIT-20Z" },
  { slug: "del-monte-corn-10-cans", name: "Whole Kernel Corn, #10 Cans", brand: "Del Monte", category: "Restaurant Supplies", subcategory: "Canned Goods", description: "Foodservice-size #10 cans of whole kernel corn.", caseSize: "Case of 6", unitCount: 6, priceCents: 2970, stock: "low", sku: "DEL-CRN-10C" },
  { slug: "mb-select-foam-containers-9in", name: "MB Select 9in Foam Hinged Containers", brand: "MB Select", category: "Restaurant Supplies", subcategory: "Disposables", description: "House-label 9-inch hinged foam takeout containers.", caseSize: "Case of 200", unitCount: 200, priceCents: 1450, stock: "in", tags: ["best-seller"], sku: "MB-RS-FOAM9" },
  { slug: "mb-select-nitrile-gloves-m", name: "MB Select Nitrile Gloves, Medium", brand: "MB Select", category: "Restaurant Supplies", subcategory: "Disposables", description: "Powder-free nitrile food-prep gloves, 100-count boxes.", caseSize: "Case of 10 boxes", unitCount: 10, priceCents: 4250, stock: "in", sku: "MB-RS-GLVM" },
  { slug: "mb-select-napkins-1ply", name: "MB Select 1-Ply Dispenser Napkins", brand: "MB Select", category: "Restaurant Supplies", subcategory: "Disposables", description: "House-label 1-ply dispenser napkins for counter service.", caseSize: "Case of 6000", unitCount: 6000, priceCents: 3890, stock: "low", tags: ["promo"], sku: "MB-RS-NAP6K" },

  // ── Health & Beauty ────────────────────────────────────────────────────
  { slug: "tide-travel-detergent-packets", name: "Travel-Size Laundry Detergent Packets", brand: "Tide", category: "Health & Beauty", subcategory: "Laundry", description: "Single-load liquid detergent packets for laundromat vending and c-store shelves.", caseSize: "Case of 156", unitCount: 156, priceCents: 2890, stock: "out", tags: ["promo"], sku: "TID-TRV-156" },
  { slug: "tide-pods-16ct-bags", name: "Laundry Detergent Pods, 16ct Bags", brand: "Tide", category: "Health & Beauty", subcategory: "Laundry", description: "Original scent detergent pods in 16-count resealable bags.", caseSize: "Case of 12", unitCount: 12, priceCents: 4740, stock: "in", sku: "TID-POD-16" },
  { slug: "mb-select-hand-soap-8oz", name: "MB Select Antibacterial Hand Soap, 8oz", brand: "MB Select", category: "Health & Beauty", subcategory: "Personal Care", description: "House-label antibacterial liquid hand soap, pump bottles.", caseSize: "Case of 24", unitCount: 24, priceCents: 1920, stock: "in", sku: "MB-HB-SOAP8" },
  { slug: "mb-select-hand-sanitizer-2oz", name: "MB Select Hand Sanitizer, 2oz", brand: "MB Select", category: "Health & Beauty", subcategory: "Personal Care", description: "Pocket-size 62% ethyl alcohol hand sanitizer bottles with clip strip.", caseSize: "Case of 48", unitCount: 48, priceCents: 2400, stock: "in", tags: ["best-seller"], sku: "MB-HB-SAN2" },
  { slug: "mb-select-travel-shampoo-2oz", name: "MB Select Travel Shampoo, 2oz", brand: "MB Select", category: "Health & Beauty", subcategory: "Travel Size", description: "House-label travel-size shampoo bottles for overnight and travel sections.", caseSize: "Case of 36", unitCount: 36, priceCents: 1620, stock: "low", sku: "MB-HB-SHMP2" },
  { slug: "mb-select-toothpaste-travel", name: "MB Select Travel Toothpaste, 0.85oz", brand: "MB Select", category: "Health & Beauty", subcategory: "Travel Size", description: "Travel-size fluoride toothpaste tubes for checkout displays.", caseSize: "Case of 72", unitCount: 72, priceCents: 2880, stock: "in", tags: ["new"], sku: "MB-HB-TPT85" },
  { slug: "mb-select-pain-relief-24ct", name: "MB Select Pain Relief Caplets, 24ct", brand: "MB Select", category: "Health & Beauty", subcategory: "OTC", description: "House-label acetaminophen 500mg caplets, 24-count boxes.", caseSize: "Case of 24", unitCount: 24, priceCents: 3360, stock: "in", sku: "MB-HB-PAIN24" },

  // ── Gemrock Apparel ────────────────────────────────────────────────────
  { slug: "gemrock-heavyweight-tee-black", name: "Gemrock Heavyweight Tee — Black", brand: "Gemrock", category: "Gemrock Apparel", subcategory: "T-Shirts", description: "Heavyweight 6.5oz cotton tee in black with chest logo, assorted sizes S–2XL per case.", caseSize: "Case of 24", unitCount: 24, priceCents: 9600, stock: "in", tags: ["promo"], sku: "GR-AP-TEEBK" },
  { slug: "gemrock-heavyweight-tee-white", name: "Gemrock Heavyweight Tee — White", brand: "Gemrock", category: "Gemrock Apparel", subcategory: "T-Shirts", description: "Heavyweight 6.5oz cotton tee in white, assorted sizes S–2XL per case.", caseSize: "Case of 24", unitCount: 24, priceCents: 9600, stock: "in", sku: "GR-AP-TEEWH" },
  { slug: "gemrock-pocket-tee-heather", name: "Gemrock Pocket Tee — Heather Gray", brand: "Gemrock", category: "Gemrock Apparel", subcategory: "T-Shirts", description: "Midweight pocket tee in heather gray with woven hem tag, assorted sizes.", caseSize: "Case of 24", unitCount: 24, priceCents: 10800, stock: "low", tags: ["new"], sku: "GR-AP-TEEHG" },
  { slug: "gemrock-pullover-hoodie-black", name: "Gemrock Pullover Hoodie — Black", brand: "Gemrock", category: "Gemrock Apparel", subcategory: "Fleece", description: "10oz fleece pullover hoodie with front pouch pocket, assorted sizes.", caseSize: "Case of 12", unitCount: 12, priceCents: 15600, stock: "in", tags: ["best-seller"], sku: "GR-AP-HDBK" },
  { slug: "gemrock-crewneck-sweatshirt-navy", name: "Gemrock Crewneck Sweatshirt — Navy", brand: "Gemrock", category: "Gemrock Apparel", subcategory: "Fleece", description: "Classic-fit crewneck sweatshirt in navy fleece, assorted sizes.", caseSize: "Case of 12", unitCount: 12, priceCents: 13200, stock: "out", sku: "GR-AP-CRNV" },
  { slug: "gemrock-snapback-cap", name: "Gemrock Snapback Cap — Black/Amber", brand: "Gemrock", category: "Gemrock Apparel", subcategory: "Headwear", description: "Structured 6-panel snapback with embroidered logo, one size.", caseSize: "Case of 24", unitCount: 24, priceCents: 12000, stock: "in", tags: ["new", "promo"], sku: "GR-AP-CAPBK" },
  { slug: "gemrock-work-shirt-khaki", name: "Gemrock Work Shirt — Khaki", brand: "Gemrock", category: "Gemrock Apparel", subcategory: "Workwear", description: "Twill button-up work shirt with embroidered chest logo, assorted sizes.", caseSize: "Case of 12", unitCount: 12, priceCents: 16800, stock: "low", sku: "GR-AP-WSKH" },
];

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Idempotent: skip when the catalog is already populated.
  const existing = await db.query.products.findFirst({ columns: { id: true } });
  if (existing) {
    console.log("Products already exist — skipping seed.");
    process.exit(0);
  }

  const rows = CATALOG.map(toRow);
  await db.insert(products).values(rows);
  console.log(`Inserted ${rows.length} products across ${new Set(rows.map((r) => r.category)).size} categories and ${new Set(rows.map((r) => r.brand)).size} brands.`);

  console.log("Done.");
  process.exit(0); // close MySQL connection pool
}

seed();
