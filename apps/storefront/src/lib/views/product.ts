import type { StoreProduct } from "../medusa/products"
import { discountPercent, isOnSale } from "../merchandising"

/**
 * Theme-agnostic product view model.
 *
 * This is THE SEAM between Medusa and themes: routes map Medusa DTOs into
 * `ProductView` once, and every theme renders from this stable shape. Medusa's
 * response shape can change without touching themes; themes can change without
 * touching Medusa. Prices are in MAJOR units (e.g. 49.99) — render directly.
 */
export type ProductView = {
  id: string
  /** PDP slug; null when a product somehow lacks a handle. */
  handle: string | null
  /** Canonical live PDP path, e.g. `/products/<handle>`. */
  href: string
  title: string
  description: string
  thumbnail: string | null
  /** Full gallery (thumbnail first if set), falling back to [thumbnail] or []. */
  images: string[]
  /** Lowest payable price across variants (major units), or null if unpriced. */
  price: number | null
  /** List price when on sale (major units), else null. */
  originalPrice: number | null
  currencyCode: string | null
  /** Largest discount across variants, 0 when not on sale. */
  discountPercent: number
  isOnSale: boolean
  createdAt: string | null
  /** Tag labels (e.g. Kids / Men / Women) — used for derived category nav. */
  tags: string[]
  // Seller-supplied merchandising metadata (via CSV import → product.metadata).
  // All null when the seller never set them; themes hide the related UI then.
  /** Average rating 0–5, or null. */
  rating: number | null
  /** Number of reviews backing `rating`, or null. */
  reviewCount: number | null
  /** Warranty blurb, e.g. "1 Year Brand Warranty", or null. */
  warranty: string | null
  /** Per-product returns policy override; falls back to store config in themes. */
  returnsPolicy: string | null
  /** Distinct "Color" option values across variants, e.g. ["Red","Blue"]. Empty when the product has no color option. */
  colors: string[]
  /** Distinct "Size" option values across variants, e.g. ["S","M","L"]. Empty when the product has no size option. */
  sizes: string[]
  /** True if any variant is purchasable (unlimited stock or quantity > 0). True when availability wasn't fetched for this route. */
  inStock: boolean
}

/** Per-variant stock lookup, as returned by `getVariantAvailability`. */
type AvailabilityMap = Record<string, { availableQuantity: number | null }>

/** Distinct option values for a variant whose option title matches one of `titles` (case-insensitive). */
function optionValues(p: StoreProduct, titles: string[]): string[] {
  const set = new Set<string>()
  for (const v of p.variants ?? []) {
    for (const opt of v.options ?? []) {
      const title = opt.option?.title?.toLowerCase()
      if (title && titles.includes(title)) set.add(opt.value)
    }
  }
  return [...set]
}

function lowestPricedVariant(p: StoreProduct) {
  return p.variants?.find(v => v.calculated_price?.calculated_amount != null) ?? null
}

/** Map a single Medusa product to the theme-agnostic view model. */
export function mapProduct(p: StoreProduct, availability?: AvailabilityMap): ProductView {
  const variant = lowestPricedVariant(p)
  const cp = variant?.calculated_price ?? null
  const discount = discountPercent(p)
  const onSale = isOnSale(p)
  const meta = p.metadata ?? {}
  const inStock = (p.variants ?? []).some(v => {
    const avail = availability?.[v.id]
    // No availability data fetched for this route, or unlimited stock — treat as purchasable.
    return !avail || avail.availableQuantity == null || avail.availableQuantity > 0
  })
  return {
    id: p.id,
    handle: p.handle,
    href: p.handle ? `/products/${p.handle}` : "#",
    title: p.title,
    description: p.description ?? "",
    thumbnail: p.thumbnail,
    images: p.images?.length ? p.images.map(i => i.url) : p.thumbnail ? [p.thumbnail] : [],
    price: cp?.calculated_amount ?? null,
    originalPrice: onSale ? (cp?.original_amount ?? null) : null,
    currencyCode: cp?.currency_code ?? null,
    discountPercent: discount,
    isOnSale: onSale,
    createdAt: p.created_at,
    tags: (p.tags ?? []).map(t => t.value),
    rating: numericMeta(meta.rating),
    reviewCount: numericMeta(meta.review_count),
    warranty: stringMeta(meta.warranty),
    returnsPolicy: stringMeta(meta.returns_policy),
    colors: optionValues(p, ["color", "colour"]),
    sizes: optionValues(p, ["size"]),
    inStock,
  }
}

/** Coerce a metadata value to a finite number, or null. */
function numericMeta(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Coerce a metadata value to a non-empty trimmed string, or null. */
function stringMeta(value: unknown): string | null {
  if (typeof value !== "string") return value == null ? null : String(value)
  const trimmed = value.trim()
  return trimmed || null
}

export function mapProducts(products: StoreProduct[], availability?: AvailabilityMap): ProductView[] {
  return products.map(p => mapProduct(p, availability))
}
