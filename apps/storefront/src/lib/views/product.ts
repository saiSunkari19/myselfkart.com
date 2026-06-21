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
}

function lowestPricedVariant(p: StoreProduct) {
  return p.variants?.find(v => v.calculated_price?.calculated_amount != null) ?? null
}

/** Map a single Medusa product to the theme-agnostic view model. */
export function mapProduct(p: StoreProduct): ProductView {
  const variant = lowestPricedVariant(p)
  const cp = variant?.calculated_price ?? null
  const discount = discountPercent(p)
  const onSale = isOnSale(p)
  return {
    id: p.id,
    handle: p.handle,
    href: p.handle ? `/products/${p.handle}` : "#",
    title: p.title,
    description: p.description ?? "",
    thumbnail: p.thumbnail,
    price: cp?.calculated_amount ?? null,
    originalPrice: onSale ? (cp?.original_amount ?? null) : null,
    currencyCode: cp?.currency_code ?? null,
    discountPercent: discount,
    isOnSale: onSale,
    createdAt: p.created_at,
    tags: (p.tags ?? []).map(t => t.value),
  }
}

export function mapProducts(products: StoreProduct[]): ProductView[] {
  return products.map(mapProduct)
}
