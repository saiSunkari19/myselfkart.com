import type { StoreProduct } from "../medusa/products"
import {
  getCategories,
  getProductCategories,
  getProductCollections,
  productsInCategoryOrTag,
} from "../merchandising"
import type { DerivedCategory } from "../merchandising"

/**
 * Theme-agnostic category view model.
 *
 * Source priority (graceful degradation):
 *   1. Real Medusa product categories assigned to the fetched products.
 *   2. Fallback: product tags (e.g. Kids / Men / Women).
 * Either way themes get the same `CategoryView` shape and never change.
 */
export type CategoryView = {
  id: string
  name: string
  count: number
  /** Live listing path filtered to this category. */
  href: string
  /**
   * A representative real image for the category — the first thumbnail of a
   * product in it. `null` when none carry one; themes then fall back to a
   * neutral placeholder, never fabricated stock photography.
   */
  image: string | null
}

/** First real product thumbnail in a category/tag, or null. */
function representativeImage(products: StoreProduct[], id: string): string | null {
  const match = productsInCategoryOrTag(products, id).find(p => p.thumbnail)
  return match?.thumbnail ?? null
}

/** Derive category views from product tags (fallback source). */
export function deriveCategoriesFromTags(products: StoreProduct[]): CategoryView[] {
  return getCategories(products).map(c => ({
    id: c.id,
    name: c.name,
    count: c.count,
    href: `/shop?category=${c.id}`,
    image: representativeImage(products, c.id),
  }))
}

/** Map a derived grouping to its theme-agnostic view (with live filter href). */
function toCategoryView(products: StoreProduct[], c: DerivedCategory): CategoryView {
  return {
    id: c.id,
    name: c.name,
    count: c.count,
    href: `/shop?category=${c.id}`,
    image: representativeImage(products, c.id),
  }
}

/**
 * Resolve the browse nav. Seller-curated **collections** are surfaced first
 * (intentional groupings like "New Arrival"), followed by the product taxonomy:
 * real Medusa categories if any, else tag-derived. All three flow through the
 * same `CategoryView` shape, so themes render them identically and `?category=`
 * filters by whichever id was clicked (see `filterByCategory`).
 */
export function resolveCategories(products: StoreProduct[]): CategoryView[] {
  const collections = getProductCollections(products)
  const real = getProductCategories(products)
  const taxonomy = real.length > 0 ? real : getCategories(products)

  const seen = new Set<string>()
  return [...collections, ...taxonomy]
    .filter(c => (seen.has(c.id) ? false : (seen.add(c.id), true)))
    .map(c => toCategoryView(products, c))
}

/** Filter products by a browse id (real category id or tag id). */
export function filterByCategory(products: StoreProduct[], id: string): StoreProduct[] {
  return productsInCategoryOrTag(products, id)
}
