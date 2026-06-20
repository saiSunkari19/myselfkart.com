export type Product = {
  id: string
  name: string
  subtitle: string
  category: string
  price: number
  originalPrice?: number
  image: string
  hoverImage: string
  badge?: "New" | "Bestseller" | "Limited" | "Award Winner"
  rating: number
  reviews: number
  skinTypes: string[]
  concerns: string[]
  description: string
  keyIngredients: string[]
  size: string
}

export type Collection = {
  id: string
  name: string
  tagline: string
  image: string
  count: number
}

export type Testimonial = {
  id: string
  name: string
  age: number
  skinType: string
  concern: string
  text: string
  result: string
  avatar: string
  rating: number
  verified: boolean
}

export type Ingredient = {
  id: string
  name: string
  source: string
  benefit: string
  color: string
  icon: string
}

export type SkinConcern = {
  id: string
  name: string
  icon: string
  description: string
  products: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Luminous Veil Serum",
    subtitle: "Vitamin C & Niacinamide Brightening Serum",
    category: "Serum",
    price: 2499,
    originalPrice: 2999,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=85",
    hoverImage: "https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=600&q=85",
    badge: "Bestseller",
    rating: 4.9,
    reviews: 2847,
    skinTypes: ["All skin types"],
    concerns: ["Brightening", "Dark spots", "Uneven tone"],
    description: "A potent brightening serum with 15% Vitamin C and 5% Niacinamide to visibly reduce dark spots and even skin tone in 4 weeks.",
    keyIngredients: ["15% Vitamin C", "5% Niacinamide", "Ferulic Acid", "Hyaluronic Acid"],
    size: "30ml",
  },
  {
    id: "p2",
    name: "Velvet Barrier Cream",
    subtitle: "Ceramide & Peptide Moisture Barrier Repair",
    category: "Moisturiser",
    price: 1899,
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=85",
    hoverImage: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=85",
    badge: "Award Winner",
    rating: 4.8,
    reviews: 1923,
    skinTypes: ["Dry", "Sensitive", "Combination"],
    concerns: ["Dryness", "Sensitivity", "Barrier repair"],
    description: "A rich yet weightless moisturiser packed with 5 ceramides and copper peptides to restore and strengthen your skin's natural barrier.",
    keyIngredients: ["Ceramide NP", "Copper Peptides", "Shea Butter", "Squalane"],
    size: "50ml",
  },
  {
    id: "p3",
    name: "Midnight Reset Oil",
    subtitle: "Rosehip & Bakuchiol Overnight Renewal",
    category: "Face Oil",
    price: 2199,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=85",
    hoverImage: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=85",
    badge: "New",
    rating: 4.7,
    reviews: 891,
    skinTypes: ["Dry", "Mature", "Normal"],
    concerns: ["Aging", "Dullness", "Fine lines"],
    description: "A luxurious overnight renewal oil combining rosehip seed oil with plant-based bakuchiol — nature's retinol alternative — for visibly younger-looking skin by morning.",
    keyIngredients: ["Rosehip Seed Oil", "Bakuchiol", "Sea Buckthorn", "Vitamin E"],
    size: "30ml",
  },
  {
    id: "p4",
    name: "Clear Calm BHA Toner",
    subtitle: "2% Salicylic Acid Pore-Refining Toner",
    category: "Toner",
    price: 1299,
    image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=85",
    hoverImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=85",
    rating: 4.6,
    reviews: 1456,
    skinTypes: ["Oily", "Combination", "Acne-prone"],
    concerns: ["Acne", "Large pores", "Oiliness"],
    description: "A gentle yet effective BHA toner with 2% salicylic acid that unclogs pores, reduces excess oil, and calms active breakouts without stripping.",
    keyIngredients: ["2% Salicylic Acid", "Niacinamide", "Centella Asiatica", "Zinc PCA"],
    size: "200ml",
  },
  {
    id: "p5",
    name: "Silk Screen SPF 50",
    subtitle: "Invisible Mineral Sunscreen with Skincare Benefits",
    category: "Sun Care",
    price: 1599,
    image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7e0827?w=600&q=85",
    hoverImage: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=85",
    badge: "Bestseller",
    rating: 4.8,
    reviews: 3201,
    skinTypes: ["All skin types"],
    concerns: ["Sun protection", "Anti-aging", "Blue light"],
    description: "A weightless mineral SPF 50 that doubles as a primer. No white cast, no pilling. Infused with antioxidants for 8-hour protection.",
    keyIngredients: ["Zinc Oxide", "Titanium Dioxide", "Niacinamide", "Vitamin E"],
    size: "50ml",
  },
  {
    id: "p6",
    name: "Petal Cleanse Balm",
    subtitle: "Melting Cleansing Balm with Rose & Jojoba",
    category: "Cleanser",
    price: 1199,
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&q=85",
    hoverImage: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=85",
    rating: 4.7,
    reviews: 2109,
    skinTypes: ["All skin types", "Sensitive"],
    concerns: ["Makeup removal", "Deep cleanse", "Hydration"],
    description: "A velvety cleansing balm that melts away makeup, SPF and impurities without stripping moisture. Transforms from balm to silky oil to creamy milk.",
    keyIngredients: ["Jojoba Esters", "Rose Hip Extract", "Sea Buckthorn", "Vitamin F"],
    size: "100ml",
  },
  {
    id: "p7",
    name: "Youth Pulse Eye Cream",
    subtitle: "Retinol & Caffeine Under-Eye Treatment",
    category: "Eye Care",
    price: 1899,
    image: "https://images.unsplash.com/photo-1643185539104-3622eb1c2a5c?w=600&q=85",
    hoverImage: "https://images.unsplash.com/photo-1631730486784-74757fd4af1d?w=600&q=85",
    badge: "New",
    rating: 4.5,
    reviews: 567,
    skinTypes: ["All skin types"],
    concerns: ["Dark circles", "Puffiness", "Fine lines"],
    description: "A targeted eye treatment combining 0.1% encapsulated retinol with 2% caffeine to visibly brighten, depuff, and smooth the delicate eye area.",
    keyIngredients: ["0.1% Encapsulated Retinol", "2% Caffeine", "Peptides", "Hyaluronic Acid"],
    size: "15ml",
  },
  {
    id: "p8",
    name: "Glow Ritual Mask",
    subtitle: "AHA Resurfacing & Brightening Treatment Mask",
    category: "Mask",
    price: 1499,
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=85",
    hoverImage: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=85",
    badge: "Limited",
    rating: 4.8,
    reviews: 1234,
    skinTypes: ["Normal", "Oily", "Combination"],
    concerns: ["Dullness", "Texture", "Brightening"],
    description: "A weekly resurfacing treatment with 10% AHA complex (glycolic + lactic) that reveals visibly smoother, brighter skin in just 15 minutes.",
    keyIngredients: ["10% AHA Complex", "Kaolin Clay", "Papaya Enzyme", "Rose Extract"],
    size: "75ml",
  },
]

export const COLLECTIONS: Collection[] = [
  {
    id: "c1",
    name: "Brightening Edit",
    tagline: "Radiance from within",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=85",
    count: 12,
  },
  {
    id: "c2",
    name: "Barrier Repair",
    tagline: "Skin that feels like skin",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=85",
    count: 8,
  },
  {
    id: "c3",
    name: "Anti-Aging Ritual",
    tagline: "Time is just a number",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=85",
    count: 10,
  },
  {
    id: "c4",
    name: "Clear Skin System",
    tagline: "Confidence in every pore",
    image: "https://images.unsplash.com/photo-1532413992378-f169ac26fff0?w=800&q=85",
    count: 9,
  },
]

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Priya S.",
    age: 28,
    skinType: "Combination",
    concern: "Hyperpigmentation",
    text: "The Luminous Veil Serum is nothing short of magical. After 6 weeks, my dark spots have visibly faded and my skin has this natural glass-skin glow I've been chasing for years. Worth every rupee.",
    result: "Visible brightening in 4 weeks",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    rating: 5,
    verified: true,
  },
  {
    id: "t2",
    name: "Ananya R.",
    age: 34,
    skinType: "Sensitive/Dry",
    concern: "Barrier damage",
    text: "I've struggled with sensitive, reactive skin my entire life. The Velvet Barrier Cream is the first moisturiser that hasn't caused a single reaction — and my skin has never felt this comfortable and nourished.",
    result: "Zero reactions, deeply hydrated",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    rating: 5,
    verified: true,
  },
  {
    id: "t3",
    name: "Kavya M.",
    age: 31,
    skinType: "Oily/Acne-prone",
    concern: "Breakouts",
    text: "I was skeptical about another toner, but the Clear Calm BHA changed my skin routine completely. Breakouts reduced by 80% in a month, pores look tighter, and my skin feels balanced — not stripped.",
    result: "80% fewer breakouts in 30 days",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80",
    rating: 5,
    verified: true,
  },
  {
    id: "t4",
    name: "Deepika J.",
    age: 42,
    skinType: "Mature/Dry",
    concern: "Aging & dullness",
    text: "The Midnight Reset Oil has become my non-negotiable. I wake up to plumper, more radiant skin every single morning. Fine lines around my eyes have softened noticeably. Absolutely stunning product.",
    result: "Plumper skin & softer fine lines",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&q=80",
    rating: 5,
    verified: true,
  },
]

export const INGREDIENTS: Ingredient[] = [
  {
    id: "i1",
    name: "Vitamin C",
    source: "Kakadu Plum & Synthetic L-Ascorbic Acid",
    benefit: "Brightens skin, neutralises free radicals, boosts collagen production and fades hyperpigmentation",
    color: "#F59E0B",
    icon: "✦",
  },
  {
    id: "i2",
    name: "Niacinamide",
    source: "Vitamin B3",
    benefit: "Minimises pores, regulates sebum, strengthens barrier, reduces redness and evens skin tone",
    color: "#8B5CF6",
    icon: "◈",
  },
  {
    id: "i3",
    name: "Ceramides",
    source: "Plant-derived & Identical to Skin",
    benefit: "Restores and maintains the skin's protective barrier, locking in moisture and keeping irritants out",
    color: "#10B981",
    icon: "⬡",
  },
  {
    id: "i4",
    name: "Bakuchiol",
    source: "Babchi Plant Seeds",
    benefit: "Plant-based retinol alternative that reduces fine lines and improves firmness without irritation",
    color: "#F472B6",
    icon: "✿",
  },
  {
    id: "i5",
    name: "Hyaluronic Acid",
    source: "Biotechnology / Fermentation",
    benefit: "Attracts and holds 1000x its weight in water, providing intense multi-depth hydration",
    color: "#60A5FA",
    icon: "◉",
  },
  {
    id: "i6",
    name: "Peptides",
    source: "Amino Acid Chains",
    benefit: "Signal skin cells to produce collagen and elastin, visibly firming and plumping skin over time",
    color: "#34D399",
    icon: "⬠",
  },
]

export const SKIN_CONCERNS = [
  { id: "acne", label: "Acne & Breakouts", icon: "●", products: ["p4", "p2"] },
  { id: "dryness", label: "Dryness", icon: "◐", products: ["p2", "p6"] },
  { id: "aging", label: "Aging & Fine Lines", icon: "◇", products: ["p3", "p7"] },
  { id: "brightening", label: "Dull Skin", icon: "✦", products: ["p1", "p8"] },
  { id: "sensitivity", label: "Sensitivity", icon: "◎", products: ["p2", "p6"] },
]

export const HERO_SLIDES = [
  {
    id: "h1",
    label: "New Launch",
    heading: "Unlock your\nskin's true glow.",
    sub: "Science-backed skincare rooted in nature. Every formula, a ritual.",
    cta: "Shop Serums",
    ctaLink: "#",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1600&q=90",
    accent: "#D8C3A5",
  },
  {
    id: "h2",
    label: "Barrier Collection",
    heading: "Repair.\nRestore.\nRadiate.",
    sub: "5 ceramides. Endless comfort. Skin that feels like skin again.",
    cta: "Explore Barrier Edit",
    ctaLink: "#",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1600&q=90",
    accent: "#C9D6C3",
  },
  {
    id: "h3",
    label: "Award Winner 2025",
    heading: "SPF that feels\nlike nothing.",
    sub: "Invisible mineral protection. No white cast. All day radiance.",
    cta: "Shop Sun Care",
    ctaLink: "#",
    image: "https://images.unsplash.com/photo-1609710228159-0fa9bd7e0827?w=1600&q=90",
    accent: "#F2E9DE",
  },
]
