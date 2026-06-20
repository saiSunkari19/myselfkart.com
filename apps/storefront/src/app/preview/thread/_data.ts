export type Product = {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  image: string
  images: string[]
  tag?: "New" | "Sale" | "Sold Out"
  sizes: string[]
  colors: { name: string; hex: string }[]
  description: string
  details: string[]
}

export type Category = {
  id: string
  name: string
  count: number
  image: string
  description: string
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Linen Oversized Shirt",
    category: "Tops",
    price: 2499,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4ded?w=800&q=80",
    ],
    tag: "New",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Sand", hex: "#d4c4a8" }, { name: "White", hex: "#f8f8f5" }, { name: "Slate", hex: "#8a9099" }],
    description: "Effortlessly relaxed, the linen oversized shirt is cut for comfort and worn for confidence. A wardrobe anchor for every season.",
    details: ["100% European linen", "Drop shoulder cut", "Button-down front", "Machine wash cold", "Imported"],
  },
  {
    id: "2",
    name: "Ribbed Tank Top",
    category: "Tops",
    price: 999,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Cream", hex: "#f0ebe2" }, { name: "Black", hex: "#1a1a1a" }, { name: "Terracotta", hex: "#c4734a" }],
    description: "The ribbed tank top — minimal in construction, maximal in versatility. Layer it, tuck it, let it breathe.",
    details: ["95% organic cotton, 5% elastane", "Slim rib knit", "Scoop neck", "Machine wash cold"],
  },
  {
    id: "3",
    name: "Wide-Leg Linen Trousers",
    category: "Bottoms",
    price: 3299,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
    ],
    tag: "New",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Oat", hex: "#e8dece" }, { name: "Camel", hex: "#c4956a" }, { name: "Charcoal", hex: "#3d3d3d" }],
    description: "Wide-leg, straight through the hip, tapering gently at the hem. Linen that drapes like silk.",
    details: ["100% Belgian linen", "Elastic waist with drawstring", "Two side pockets", "Machine wash cold", "Imported"],
  },
  {
    id: "4",
    name: "Tailored Straight Trousers",
    category: "Bottoms",
    price: 3799,
    originalPrice: 4599,
    image: "https://images.unsplash.com/photo-1594938374182-a55022f33b23?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1594938374182-a55022f33b23?w=800&q=80",
    ],
    tag: "Sale",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Ivory", hex: "#f5f0e8" }, { name: "Navy", hex: "#1e2d4a" }, { name: "Stone", hex: "#a09080" }],
    description: "A straight leg that means business. Tailored seams, clean front, and a break at the ankle that's just right.",
    details: ["68% polyester, 32% viscose", "Flat-front tailored cut", "Side zip closure", "Dry clean recommended"],
  },
  {
    id: "5",
    name: "Minimal Slip Dress",
    category: "Dresses",
    price: 2799,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
    ],
    tag: "New",
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Champagne", hex: "#e8d9b5" }, { name: "Black", hex: "#1a1a1a" }, { name: "Blush", hex: "#e8c4b8" }],
    description: "Cut on the bias, worn with nothing or layered with everything. The slip dress as it was always meant to be.",
    details: ["100% Tencel lyocell", "Adjustable spaghetti straps", "Side split", "Hand wash recommended"],
  },
  {
    id: "6",
    name: "Wrap Midi Dress",
    category: "Dresses",
    price: 3499,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Rust", hex: "#b8542a" }, { name: "Sage", hex: "#7a8c70" }, { name: "Cream", hex: "#f0ebe2" }],
    description: "A wrap silhouette that flatters every body. Midi length, self-tie waist, fluid drape.",
    details: ["100% viscose", "Adjustable wrap tie", "V-neck", "Machine wash cold, gentle cycle"],
  },
  {
    id: "7",
    name: "Oversized Wool Coat",
    category: "Outerwear",
    price: 8999,
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80",
    ],
    tag: "New",
    sizes: ["XS/S", "M/L", "XL/XXL"],
    colors: [{ name: "Camel", hex: "#c4956a" }, { name: "Charcoal", hex: "#3d3d3d" }, { name: "Ecru", hex: "#ede8de" }],
    description: "The coat that anchors every look. Oversized proportions, notch lapels, and a wool-blend construction built to last seasons.",
    details: ["70% wool, 30% polyamide", "Fully lined", "Two patch pockets", "Dry clean only", "Made in Portugal"],
  },
  {
    id: "8",
    name: "Cropped Blazer",
    category: "Outerwear",
    price: 5499,
    originalPrice: 6499,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    ],
    tag: "Sale",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Beige", hex: "#d4c4a8" }, { name: "Check", hex: "#8a7868" }],
    description: "Cropped at the hip, structured at the shoulder. A blazer that borrows from tailoring and gives back in modernity.",
    details: ["75% polyester, 25% viscose", "Partially lined", "Single button closure", "Dry clean recommended"],
  },
  {
    id: "9",
    name: "Cargo Wide-Leg Pants",
    category: "Bottoms",
    price: 2999,
    image: "https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Khaki", hex: "#9a8c70" }, { name: "Black", hex: "#1a1a1a" }, { name: "Stone", hex: "#c8bfb0" }],
    description: "Utilitarian meets editorial. Wide leg, low-rise, with cargo pockets that actually hold things.",
    details: ["100% cotton twill", "Elasticated waist", "Four cargo pockets", "Machine wash cold"],
  },
  {
    id: "10",
    name: "Knit Polo Top",
    category: "Tops",
    price: 1799,
    image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Moss", hex: "#6a7a5a" }, { name: "Ivory", hex: "#f5f0e8" }, { name: "Burgundy", hex: "#6b2737" }],
    description: "Knit construction with a polo collar. Relaxed through the body, refined at the neck.",
    details: ["100% merino wool", "Relaxed fit", "Three-button placket", "Hand wash or dry clean"],
  },
  {
    id: "11",
    name: "Asymmetric Hem Dress",
    category: "Dresses",
    price: 4199,
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80",
    ],
    tag: "New",
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Midnight", hex: "#1a2035" }, { name: "Taupe", hex: "#b5a898" }],
    description: "An asymmetric hem that shifts with every step. Fluid fabric, structural intent, quietly dramatic.",
    details: ["100% cupro", "Side zip", "Asymmetric hemline", "Dry clean only", "Made in India"],
  },
  {
    id: "12",
    name: "Cotton Bomber Jacket",
    category: "Outerwear",
    price: 4999,
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Olive", hex: "#6b7240" }, { name: "Black", hex: "#1a1a1a" }, { name: "Ecru", hex: "#ede8de" }],
    description: "A cotton bomber stripped of excess. Clean ribs, minimal hardware, and a silhouette that works from morning to midnight.",
    details: ["100% cotton shell", "Fully lined", "Two zip pockets", "Zip front closure", "Machine wash cold"],
  },
]

export const CATEGORIES: Category[] = [
  {
    id: "tops",
    name: "Tops",
    count: 18,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
    description: "Shirts, tanks, knits, and blouses for every occasion.",
  },
  {
    id: "bottoms",
    name: "Bottoms",
    count: 24,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
    description: "Trousers, skirts, and pants that move with you.",
  },
  {
    id: "dresses",
    name: "Dresses",
    count: 15,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80",
    description: "From slip dresses to midi lengths — wear them your way.",
  },
  {
    id: "outerwear",
    name: "Outerwear",
    count: 12,
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80",
    description: "Coats, blazers, and jackets that define the look.",
  },
]
