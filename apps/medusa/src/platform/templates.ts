export type TemplateId = "eventpass" | "thread" | "aurum" | "volt" | "glow"

export type Template = {
  id: TemplateId
  name: string
  description: string
  good_for: string
  preview_path: string
  thumbnail_url: string
  is_default: boolean
}

/**
 * Hardcoded template registry. preview_path is relative — the admin UI
 * prepends the storefront base URL (localhost in dev, live domain in prod).
 * To go live: update VITE_STOREFRONT_URL env var only, paths stay the same.
 */
export const TEMPLATES: Template[] = [
  {
    id: "eventpass",
    name: "EventPass",
    description: "Premium event discovery and ticket booking experience.",
    good_for: "Ticketing platforms, events, experiences",
    preview_path: "/preview/eventpass",
    thumbnail_url: "/templates/eventpass.png",
    is_default: true,
  },
  {
    id: "thread",
    name: "Thread",
    description: "Modern fashion storefront for men, women, and kids.",
    good_for: "Clothing, apparel, accessories",
    preview_path: "/preview/thread",
    thumbnail_url: "/templates/thread.png",
    is_default: false,
  },
  {
    id: "aurum",
    name: "Aurum",
    description: "Elegant, image-led store with a luxury feel.",
    good_for: "Jewellery, high-end goods, premium accessories",
    preview_path: "/preview/aurum",
    thumbnail_url: "/templates/aurum.png",
    is_default: false,
  },
  {
    id: "volt",
    name: "Volt",
    description: "Structured, high-density grid built for large catalogs.",
    good_for: "Electronics, plastic goods, general retail",
    preview_path: "/preview/volt",
    thumbnail_url: "/templates/volt.png",
    is_default: false,
  },
  {
    id: "glow",
    name: "Glow",
    description: "Premium skincare & beauty storefront with a luxury editorial feel.",
    good_for: "Skincare, beauty, wellness, cosmetics",
    preview_path: "/preview/glow",
    thumbnail_url: "/templates/glow.png",
    is_default: false,
  },
]

export const TEMPLATE_IDS = new Set<string>(TEMPLATES.map((t) => t.id))
