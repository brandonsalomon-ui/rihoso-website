// The WOLF Collection on rihoso.com — a curated selection of WOLF 1834 watch winders,
// watch boxes and travel pieces. Orders are drop-shipped by WOLF through Providence
// Diamond's authorized-dealer account, with no invoice or pricing in the package.
//
// Prices are WOLF's US retail (MSRP) as listed on wolf1834.com on Nov 10 2026.
// SKUs are WOLF's own item numbers — they match the vendor style codes in Edge (vendor "WO").
// Photos are served from WOLF's product image library.

const IMAGE_BASE = "https://www.wolf1834.com/media/catalog/product/cache/0dc030c9c1dd5bd0f0216b02e0867cf7/";

export type WolfCategory = "winders" | "boxes" | "travel";

export const WOLF_CATEGORIES: { id: WolfCategory; title: string; blurb: string }[] = [
  {
    id: "winders",
    title: "Watch Winders",
    blurb: "Keep automatic watches wound, set and ready to wear — from a single Cub to an eight-watch Axis.",
  },
  {
    id: "boxes",
    title: "Watch Boxes",
    blurb: "A proper home for a growing collection.",
  },
  {
    id: "travel",
    title: "Travel & Watch Rolls",
    blurb: "Protect your watches on the road, and give them a place to rest at the hotel.",
  },
];

export type WolfColor = { name: string; sku: string; images: string[] };

export type WolfProduct = {
  slug: string;
  name: string;
  collection: string;
  category: WolfCategory;
  priceCents: number;
  bestSeller?: boolean;
  summary: string;
  features: string[];
  colors: WolfColor[];
  /** Page on wolf1834.com the details were taken from. */
  source: string;
};

function c(name: string, sku: string, paths: string[]): WolfColor {
  return { name, sku, images: paths.map((p) => IMAGE_BASE + p) };
}

export const WOLF_PRODUCTS: WolfProduct[] = [
  /* ───────────── winders ───────────── */
  {
    slug: "cub-single-winder",
    name: "Cub Single Watch Winder with Cover",
    collection: "Cub",
    category: "winders",
    priceCents: 39900,
    bestSeller: true,
    summary:
      "WOLF's compact six-sided winder for one automatic watch. Simple to set, quiet on a dresser, and stackable as a collection grows.",
    features: [
      "Holds one automatic watch",
      "Six-sided vegan leather case with a protective cover",
      "Stack several Cubs together as your collection grows",
    ],
    colors: [
      c("Black", "461103", ["r/-/r-461103_1.jpg", "r/-/r-461103_2.jpg", "p/r/pre-programmed_winders_cub_winder_black_969x600.jpg"]),
      c("Brown", "461106", ["r/-/r-461106_1.jpg", "r/-/r-461106_2.jpg", "p/r/pre-programmed_winders_cub_winder_brown_969x600.jpg"]),
      c("Navy", "461117", ["r/-/r-461117_1.jpg", "r/-/r-461117_2.jpg", "p/r/pre-programmed_winders_cub_winder_navy_969x600.jpg"]),
      c("Green", "461141", ["r/-/r-461141_1.jpg", "r/-/r-461141_2.jpg", "p/r/pre-programmed_winders_cub_winder_green_969x600.jpg"]),
      c("Cognac", "461127", ["r/-/r-461127_1.jpg", "r/-/r-461127_2.jpg", "p/r/pre-programmed_winders_cub_winder_brown_969x600_1.jpg"]),
      c("Future Grey", "461165", ["4/6/461165-1.jpg", "4/6/461165-2.jpg", "4/6/461165-3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/cub-winder-with-cover/black",
  },
  {
    slug: "cub-double-winder",
    name: "Cub Double Watch Winder with Cover",
    collection: "Cub",
    category: "winders",
    priceCents: 78900,
    bestSeller: true,
    summary: "The Cub, built for two. The same six-sided design, with room to keep a pair of automatics wound side by side.",
    features: ["Holds two automatic watches", "Six-sided vegan leather case with a protective cover", "Compact enough for a nightstand or closet shelf"],
    colors: [
      c("Black", "461203", ["r/-/r-461203_1.jpg", "r/-/r-461203_2.jpg", "p/r/pre-programmed_winders_cub_double_winder_black_969x600.jpg"]),
      c("Brown", "461206", ["r/-/r-461206_1.jpg", "r/-/r-461206_2.jpg", "r/-/r-461206_3.jpg"]),
      c("Navy", "461217", ["r/-/r-461217_1.jpg", "r/-/r-461217_2.jpg", "r/-/r-461217_3.jpg"]),
      c("Green", "461241", ["4/6/461241-1_2.jpg", "4/6/461241-2_2.jpg", "4/6/461241-3_2.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/double-cub-winder-with-cover/black",
  },
  {
    slug: "the-rocket",
    name: "The Rocket Travel Watch Winder",
    collection: "Rocket",
    category: "winders",
    priceCents: 69900,
    summary:
      "WOLF calls it the world's smallest travel winder. It fits in the palm of your hand and runs inside a hotel safe, so your watch is wound and on time when you land.",
    features: ["Holds one automatic watch", "Small enough for a carry-on or overnight bag", "Works inside a hotel safe"],
    colors: [
      c("Black", "543210", ["5/4/543210_1a.jpg", "5/4/543210_2a.jpg", "5/4/543210_4_1.jpg"]),
      c("Champagne", "543246", ["5/4/543246-1.jpg", "5/4/543246-2.jpg", "5/4/543246-3.jpg"]),
      c("Robin's Egg Blue", "543224", ["5/4/543224-1.jpg", "5/4/543224-2.jpg", "5/4/543224-3.jpg"]),
      c("Red", "543272", ["5/4/543272-1.jpg", "5/4/543272-2.jpg", "5/4/543272-3_copy.jpg"]),
      c("Pink", "543290", ["5/4/543290-1.jpg", "5/4/543290-2.jpg", "5/4/543290-3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/the-rocket/black",
  },
  {
    slug: "british-racing-single-winder",
    name: "British Racing Single Watch Winder with Storage",
    collection: "British Racing",
    category: "winders",
    priceCents: 89900,
    summary:
      "A single winder from WOLF's British Racing collection, with a storage compartment for a second watch or cufflinks. Racing green or classic black.",
    features: ["Winds one automatic watch", "Additional storage compartment", "Vegan leather finish from the British Racing collection"],
    colors: [
      c("Green", "792141", ["r/-/r-792141_1.jpg", "r/-/r-792141_2.jpg", "r/-/r-792141_3.jpg"]),
      c("Black", "792102", ["r/-/r-792102_1.jpg", "r/-/r-792102_2.jpg", "r/-/r-792102_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/british-racing-single-watch-winder/green",
  },
  {
    slug: "british-racing-double-winder",
    name: "British Racing Double Watch Winder with Storage",
    collection: "British Racing",
    category: "winders",
    priceCents: 177500,
    summary: "Two winders and a storage compartment in WOLF's British Racing finish — a handsome step up for a two-watch rotation.",
    features: ["Winds two automatic watches", "Storage compartment for additional pieces", "Vegan leather finish from the British Racing collection"],
    colors: [
      c("Green", "792241", ["r/-/r-792241_1.jpg", "r/-/r-792241_2.jpg", "s/k/sku_core-winders_interiors_109r.jpg"]),
      c("Black", "792202", ["r/-/r-792202_1.jpg", "r/-/r-792202_2.jpg", "s/k/sku_core-winders_interiors_109r2_1.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/british-racing-double-watch-winder/green",
  },
  {
    slug: "british-racing-4-winder",
    name: "British Racing 4 Piece Watch Winder",
    collection: "British Racing",
    category: "winders",
    priceCents: 304900,
    bestSeller: true,
    summary: "Four winders in one British Racing cabinet — one of WOLF's best sellers and a natural centerpiece for a serious collection.",
    features: ["Winds four automatic watches", "Vegan leather finish from the British Racing collection", "Racing green or classic black"],
    colors: [
      c("Green", "793041", ["r/-/r-793041_1.jpg", "r/-/r-793041_2.jpg", "r/-/r-793041_3.jpg"]),
      c("Black", "793002", ["r/-/r-793002_1.jpg", "r/-/r-793002_2.jpg", "r/-/r-793002_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/british-racing-4pc-watch-winder/green",
  },
  {
    slug: "british-racing-6-winder",
    name: "British Racing 6 Piece Watch Winder",
    collection: "British Racing",
    category: "winders",
    priceCents: 440500,
    bestSeller: true,
    summary: "Six winders in WOLF's British Racing finish, for the collector whose automatics have outgrown a dresser top.",
    features: ["Winds six automatic watches", "Vegan leather finish from the British Racing collection", "Racing green or classic black"],
    colors: [
      c("Green", "792441", ["r/-/r-792441_1.jpg", "r/-/r-792441_2.jpg", "7/9/792441-ba.jpg"]),
      c("Black", "792402", ["r/-/r-792402_1.jpg", "r/-/r-792402_2.jpg", "r/-/r-792402_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/british-racing-6-piece-watch-winder/green",
  },
  {
    slug: "axis-4-winder",
    name: "Axis 4 Piece Watch Winder",
    collection: "Axis",
    category: "winders",
    priceCents: 304900,
    bestSeller: true,
    summary:
      "Axis is WOLF's modern line: laser-cut perforated steel in a powder-coat or copper-plated finish, with WOLF's rotation-counting technology for precise turns per day.",
    features: [
      "Winds four automatic watches",
      "Laser-cut perforated steel, powder-coated or copper-plated",
      "Counts rotations for precise turns per day",
      "Micro suede interior and locking glass cover",
    ],
    colors: [
      c("Copper", "469516", ["r/-/r-469516_1.jpg", "r/-/r-469516_2.jpg", "r/-/r-469516_3.jpg"]),
      c("Powder Coat", "469503", ["r/-/r-469503_1.jpg", "r/-/r-469503_2.jpg", "r/-/r-469503_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/axis-4-piece-winder/copper",
  },
  {
    slug: "axis-6-winder",
    name: "Axis 6 Piece Watch Winder",
    collection: "Axis",
    category: "winders",
    priceCents: 440500,
    bestSeller: true,
    summary: "Six winders in WOLF's bold Axis design — perforated steel, clean lines and precise rotation counting.",
    features: [
      "Winds six automatic watches",
      "Laser-cut perforated steel, powder-coated or copper-plated",
      "Counts rotations for precise turns per day",
    ],
    colors: [
      c("Copper", "469616", ["r/-/r-469616_1.jpg", "r/-/r-469616_2.jpg", "r/-/r-469616_3.jpg"]),
      c("Powder Coat", "469603", ["r/-/r-469603_1.jpg", "r/-/r-469603_2.jpg", "r/-/r-469603_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/axis-6-piece-winder/copper",
  },
  {
    slug: "axis-8-winder",
    name: "Axis 8 Piece Watch Winder",
    collection: "Axis",
    category: "winders",
    priceCents: 567500,
    bestSeller: true,
    summary: "The largest Axis: eight winders in one statement piece for a collection that lives on the wrist in rotation.",
    features: [
      "Winds eight automatic watches",
      "Laser-cut perforated steel, powder-coated or copper-plated",
      "Counts rotations for precise turns per day",
    ],
    colors: [
      c("Powder Coat", "469703", ["r/-/r-469703_1.jpg", "r/-/r-469703_2.jpg", "r/-/r-469703_3.jpg"]),
      c("Copper", "469716", ["r/-/r-469716_1.jpg", "r/-/r-469716_2.jpg", "r/-/r-469716_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/axis-8-piece-winder/powdercoat",
  },
  {
    slug: "the-den-4-winder-safe",
    name: "The Den 4 Piece Watch Winder Safe",
    collection: "The Den",
    category: "winders",
    priceCents: 419900,
    bestSeller: true,
    summary:
      "WOLF's number-one seller: a compact safe with four built-in winders and lockable storage above for watches and valuables.",
    features: [
      "Four WOLF winders, pre-programmed to 900 turns per day",
      "Storage above, including a vault tray with a removable three-watch tray",
      "Opens with a biometric reader or key",
      "Vegan leather exterior",
    ],
    colors: [
      c("Black", "430402", ["4/3/430402-1.jpg", "4/3/430402-2.jpg", "4/3/430402-3.jpg"]),
      c("Green", "430441", ["d/e/den_028r.jpg", "d/e/den_219r.jpg", "s/k/sku_den_059r-2_1.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/the-den-4-piece-safe/black",
  },

  /* ───────────── boxes ───────────── */
  {
    slug: "axis-10-watch-box",
    name: "Axis 10 Piece Watch Box",
    collection: "Axis",
    category: "boxes",
    priceCents: 66900,
    bestSeller: true,
    summary: "Ten watches, one bold box — WOLF's Axis design in perforated steel with a powder-coat or copper-plated finish.",
    features: ["Holds ten watches", "Laser-cut perforated steel, powder-coated or copper-plated", "From WOLF's modern Axis collection"],
    colors: [
      c("Powder Coat", "488103", ["r/-/r-488103_1.jpg", "r/-/r-488103_2.jpg", "r/-/r-488103_3.jpg"]),
      c("Copper", "488116", ["r/-/r-488116_1.jpg", "r/-/r-488116_2.jpg", "r/-/r-488116_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/axis-10pc-watch-box/powdercoat",
  },
  {
    slug: "british-racing-8-watch-box",
    name: "British Racing 8 Piece Watch Box",
    collection: "British Racing",
    category: "boxes",
    priceCents: 62500,
    summary: "Eight watches displayed and protected in WOLF's British Racing finish. Racing green or classic black.",
    features: ["Holds eight watches", "Vegan leather finish from the British Racing collection"],
    colors: [
      c("Green", "792641", ["r/-/r-792641_1.jpg", "r/-/r-792641_2.jpg", "r/-/r-792641_3.jpg"]),
      c("Black", "792602", ["r/-/r-792602_1.jpg", "r/-/r-792602_2.jpg", "r/-/r-792602_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/british-racing-8-piece-watch-box/green",
  },

  /* ───────────── travel ───────────── */
  {
    slug: "british-racing-travel-stand",
    name: "British Racing Single Travel Watch Stand",
    collection: "British Racing",
    category: "travel",
    priceCents: 19900,
    bestSeller: true,
    summary:
      "A folding stand that holds your watch on the nightstand at home or on the road. Folds flat for the suitcase — a favorite gift.",
    features: ["Displays one watch", "WOLF's patented folding design", "Vegan leather, racing green or black"],
    colors: [
      c("Green", "485441", ["r/-/r-485441_1.jpg", "r/-/r-485441_2.jpg", "r/-/r-485441_3.jpg"]),
      c("Black", "485402", ["r/-/r-485402_1.jpg", "r/-/r-485402_2.jpg", "r/-/r-485402_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/british-racing-single-travel-watch-stand/green",
  },
  {
    slug: "oxford-travel-stand",
    name: "Heritage Oxford Single Travel Watch Stand",
    collection: "Heritage Oxford",
    category: "travel",
    priceCents: 19900,
    bestSeller: true,
    summary: "Compact and lightweight, a dedicated place to set your watch down when you're away from home.",
    features: ["Displays one watch", "Compact and lightweight for travel", "Heritage Oxford black finish"],
    colors: [c("Heritage Oxford Black", "485102", ["r/-/r-485102_1.jpg", "r/-/r-485102_2.jpg", "r/-/r-485102_3.jpg"])],
    source: "https://www.wolf1834.com/us/single-travel-watch-stand/heritageoxfordblack",
  },
  {
    slug: "british-racing-triple-roll",
    name: "British Racing Triple Watch Roll",
    collection: "British Racing",
    category: "travel",
    priceCents: 29900,
    bestSeller: true,
    summary: "Three watches, safely separated for travel, plus a hidden capsule for cufflinks or a ring.",
    features: ["Holds three watches", "Hidden jewelry capsule", "Vegan leather, racing green or black"],
    colors: [
      c("Green", "792941", ["r/-/r-792941_1.jpg", "r/-/r-792941_2.jpg", "r/-/r-792941_3.jpg"]),
      c("Black", "792902", ["r/-/r-792902_1.jpg", "r/-/r-792902_2.jpg", "r/-/r-792902_3.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/british-racing-triple-watch-roll/green",
  },
  {
    slug: "cortica-triple-roll",
    name: "Cortiça Triple Hexagon Watch Roll with Capsule",
    collection: "Cortiça",
    category: "travel",
    priceCents: 30500,
    bestSeller: true,
    summary:
      "Handmade from sustainably grown Portuguese cork. The hexagonal roll lies flat to display three watches, then fastens closed for travel or the dresser.",
    features: ["Holds three watches", "Handmade from Portuguese cork", "Lies flat to display, fastens closed to travel", "Includes a capsule"],
    colors: [c("Cork", "668361", ["6/6/668361-1_1.jpg", "n/_/n_668361-3.jpg", "n/_/n_668361-4.jpg"])],
    source: "https://www.wolf1834.com/us/cortica-triple-hexagon-watch-roll-with-capsule/cork",
  },
  {
    slug: "british-racing-single-roll",
    name: "British Racing Single Watch Roll",
    collection: "British Racing",
    category: "travel",
    priceCents: 9500,
    summary: "WOLF's most compact single watch roll — the easy way to carry a second watch, and a perfect stocking stuffer.",
    features: ["Holds one watch", "WOLF's most compact watch roll", "Vegan leather, racing green or black"],
    colors: [
      c("Green", "792041", ["r/-/r-792041_1.jpg", "r/-/r-792041_2.jpg", "5/2/529081-thumbnail.jpg"]),
      c("Black", "792002", ["r/-/r-792002_1_1.jpg", "r/-/r-792002_2_1.jpg", "r/-/r-792002_3_1.jpg"]),
    ],
    source: "https://www.wolf1834.com/us/british-racing-single-watch-roll/green",
  },
];

export const WOLF_MAX_QTY = 5;

export function getWolfProduct(slug: string) {
  return WOLF_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export function wolfPrice(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}
