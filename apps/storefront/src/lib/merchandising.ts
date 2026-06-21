import type { StoreProduct } from "./medusa/products"

/**
 * Merchandising derivations for storefront templates.
 *
 * A plain product upload carries no "deal", "best seller" or "brand" data —
 * those are merchandising concepts, not product attributes. Rather than
 * fabricating them, every template asks these helpers what can be *truthfully*
 * derived from the tenant's real products and hides any section that comes back
 * empty (graceful degradation).
 *
 * Derivable for free:
 *   - New arrivals  → product.created_at (newest first)
 *   - Deals         → variants on an active sale (original_amount > calculated_amount)
 *   - Categories    → product tags (e.g. Kids / Men / Women)
 *
 * Not derivable without extra data (left to the caller to hide):
 *   - Best sellers  → needs sales/order history
 *   - Brands        → needs brand data
 */

/** Lowest calculated (payable) price across a product's variants, or null. */
export function lowestPrice(product: StoreProduct): number | null {
  const amounts = product.variants
    ?.map(v => v.calculated_price?.calculated_amount)
    .filter((a): a is number => a != null)
  return amounts && amounts.length > 0 ? Math.min(...amounts) : null
}

/** True when any variant is on an active sale (list price beats payable price). */
export function isOnSale(product: StoreProduct): boolean {
  return (product.variants ?? []).some(v => {
    const p = v.calculated_price
    return p?.calculated_amount != null
      && p.original_amount != null
      && p.original_amount > p.calculated_amount
  })
}

/** Largest discount percentage across a product's variants (0 when none). */
export function discountPercent(product: StoreProduct): number {
  let best = 0
  for (const v of product.variants ?? []) {
    const p = v.calculated_price
    if (p?.calculated_amount != null && p.original_amount != null && p.original_amount > p.calculated_amount) {
      best = Math.max(best, Math.round((1 - p.calculated_amount / p.original_amount) * 100))
    }
  }
  return best
}

/** Products on an active sale — empty array means "hide the Deals section". */
export function getDeals(products: StoreProduct[]): StoreProduct[] {
  return products.filter(isOnSale)
}

/** Products newest-first by created_at. */
export function getNewArrivals(products: StoreProduct[]): StoreProduct[] {
  return [...products].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0
    const tb = b.created_at ? Date.parse(b.created_at) : 0
    return tb - ta
  })
}

export type DerivedCategory = {
  id: string
  name: string
  count: number
}

/** Distinct product tags as a category list, most-populated first. */
export function getCategories(products: StoreProduct[]): DerivedCategory[] {
  const byTag = new Map<string, DerivedCategory>()
  for (const p of products) {
    for (const t of p.tags ?? []) {
      const existing = byTag.get(t.id)
      if (existing) existing.count++
      else byTag.set(t.id, { id: t.id, name: t.value, count: 1 })
    }
  }
  return [...byTag.values()].sort((a, b) => b.count - a.count)
}

/**
 * Real Medusa product categories present on the fetched products, with counts,
 * most-populated first. Empty when no products carry a category — callers then
 * fall back to `getCategories` (tags).
 */
export function getProductCategories(products: StoreProduct[]): DerivedCategory[] {
  const byId = new Map<string, DerivedCategory>()
  for (const p of products) {
    for (const c of p.categories ?? []) {
      const existing = byId.get(c.id)
      if (existing) existing.count++
      else byId.set(c.id, { id: c.id, name: c.name, count: 1 })
    }
  }
  return [...byId.values()].sort((a, b) => b.count - a.count)
}

/** Products carrying a given tag id. */
export function productsInCategory(products: StoreProduct[], tagId: string): StoreProduct[] {
  return products.filter(p => (p.tags ?? []).some(t => t.id === tagId))
}

/**
 * Products matching a browse id that may be either a real category id or a tag
 * id (the `?category=` param carries whichever the nav was built from).
 */
export function productsInCategoryOrTag(products: StoreProduct[], id: string): StoreProduct[] {
  return products.filter(
    p =>
      (p.categories ?? []).some(c => c.id === id) ||
      (p.tags ?? []).some(t => t.id === id)
  )
}
