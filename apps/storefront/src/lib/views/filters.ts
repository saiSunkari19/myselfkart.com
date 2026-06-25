import type { ProductView } from "./product"

/**
 * Shop-page facet filtering — theme-agnostic, operates on already-mapped
 * `ProductView[]` (post category/search, pre-pagination). Themes render the
 * sidebar from `ProductFilters` (active selections) + the facet lists
 * (`deriveColorFacets`/`deriveSizeFacets`) and link-toggle each value; there is
 * no client JS, the same pattern the existing category filter already uses.
 */

export type PriceBucket = { id: string; label: string; min: number; max: number | null }

/** Fixed price buckets — simple link-toggle filtering needs discrete buckets, not a slider. */
export const PRICE_BUCKETS: PriceBucket[] = [
  { id: "u999", label: "Under ₹999", min: 0, max: 999 },
  { id: "999-1999", label: "₹999 – ₹1,999", min: 999, max: 1999 },
  { id: "1999-2999", label: "₹1,999 – ₹2,999", min: 1999, max: 2999 },
  { id: "2999plus", label: "Over ₹2,999", min: 2999, max: null },
]

/** Rating thresholds offered as link-toggle options. */
export const RATING_OPTIONS = [4, 3] as const

export type ProductFilters = {
  inStock: boolean
  priceBucket: string | null
  minRating: number | null
  onSale: boolean
  color: string | null
  size: string | null
}

export const EMPTY_FILTERS: ProductFilters = {
  inStock: false,
  priceBucket: null,
  minRating: null,
  onSale: false,
  color: null,
  size: null,
}

/** Parse raw searchParams strings into typed filter selections. */
export function parseProductFilters(params: {
  inStock?: string
  price?: string
  minRating?: string
  onSale?: string
  color?: string
  size?: string
}): ProductFilters {
  return {
    inStock: params.inStock === "1",
    priceBucket: params.price ?? null,
    minRating: params.minRating ? Number(params.minRating) || null : null,
    onSale: params.onSale === "1",
    color: params.color ?? null,
    size: params.size ?? null,
  }
}

/** True if any facet filter (not category/search) is active. */
export function hasActiveFilters(f: ProductFilters): boolean {
  return f.inStock || !!f.priceBucket || f.minRating != null || f.onSale || !!f.color || !!f.size
}

/** Apply active filters to an already category/search-filtered product list. */
export function applyProductFilters(products: ProductView[], filters: ProductFilters): ProductView[] {
  let out = products
  if (filters.inStock) out = out.filter(p => p.inStock)
  if (filters.priceBucket) {
    const bucket = PRICE_BUCKETS.find(b => b.id === filters.priceBucket)
    if (bucket) {
      out = out.filter(
        p => p.price != null && p.price >= bucket.min && (bucket.max == null || p.price < bucket.max)
      )
    }
  }
  if (filters.minRating != null) out = out.filter(p => (p.rating ?? 0) >= filters.minRating!)
  if (filters.onSale) out = out.filter(p => p.isOnSale)
  if (filters.color) out = out.filter(p => p.colors.includes(filters.color!))
  if (filters.size) out = out.filter(p => p.sizes.includes(filters.size!))
  return out
}

/** Distinct color values across a product list, for the sidebar. */
export function deriveColorFacets(products: ProductView[]): string[] {
  return [...new Set(products.flatMap(p => p.colors))].sort()
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL", "5XL"]

/** Distinct size values across a product list, sorted by garment size order (not alphabetically). */
export function deriveSizeFacets(products: ProductView[]): string[] {
  const set = new Set(products.flatMap(p => p.sizes))
  return [...set].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.toUpperCase())
    const bi = SIZE_ORDER.indexOf(b.toUpperCase())
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })
}

/** Build a `/shop` href that merges the current category + filters with a patch, dropping params that become falsy. */
export function buildShopFilterHref(
  activeCategory: string | null,
  filters: ProductFilters,
  patch: Partial<ProductFilters>,
  page?: number
): string {
  const next = { ...filters, ...patch }
  const params = new URLSearchParams()
  if (activeCategory) params.set("category", activeCategory)
  if (next.inStock) params.set("inStock", "1")
  if (next.priceBucket) params.set("price", next.priceBucket)
  if (next.minRating != null) params.set("minRating", String(next.minRating))
  if (next.onSale) params.set("onSale", "1")
  if (next.color) params.set("color", next.color)
  if (next.size) params.set("size", next.size)
  if (page && page > 1) params.set("page", String(page))
  const qs = params.toString()
  return `/shop${qs ? `?${qs}` : ""}`
}
