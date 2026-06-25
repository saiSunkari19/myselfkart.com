import { StorefrontStatePage } from "../../components/storefront-state"
import { getTheme } from "../../lib/themes"
import {
  mapProducts,
  resolveCategories,
  resolveCollections,
  filterByCategory,
  parseProductFilters,
  applyProductFilters,
  deriveColorFacets,
  deriveSizeFacets,
} from "../../lib/views"
import { listTenantProducts, getVariantAvailability } from "../../lib/medusa/products"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"
import { getCartItemCount } from "../../lib/cart/item-count"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 24

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    q?: string
    page?: string
    price?: string
    inStock?: string
    minRating?: string
    onSale?: string
    color?: string
    size?: string
  }>
}) {
  const tenant = await resolveTenant()

  if (!tenant) return <StorefrontStatePage state="not-found" />
  if (tenant.status === "draft") return <StorefrontStatePage state="draft" />
  if (tenant.status === "suspended") return <StorefrontStatePage state="suspended" />

  const [params, [products, config, cartCount]] = await Promise.all([
    searchParams,
    Promise.all([listTenantProducts(tenant), fetchStoreConfig(tenant), getCartItemCount(tenant)]),
  ])
  const { category, q, page: pageParam } = params

  const categories = resolveCategories(products)
  const collections = resolveCollections(products)
  // A browse id may be a category, a collection, or a tag — accept any of them so
  // ?category=<collectionId> still filters now that collections are their own list.
  const isBrowsable = (id: string) =>
    categories.some(c => c.id === id) || collections.some(c => c.id === id)
  const activeCategory = category && isBrowsable(category) ? category : null
  let filtered = activeCategory ? filterByCategory(products, activeCategory) : products

  if (q?.trim()) {
    const needle = q.trim().toLowerCase()
    filtered = filtered.filter(
      p =>
        p.title.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle) ||
        p.tags.some(t => t.value.toLowerCase().includes(needle))
    )
  }

  const availability = await getVariantAvailability(tenant, filtered.map(p => p.id))
  // Map the full category/search-filtered set (not just the page slice) so the
  // facet/price/availability filters below — and pagination after them — see
  // the right totals.
  const allViewProducts = mapProducts(filtered, availability)

  // Facets reflect the current category, not the current facet selection — so
  // picking a color doesn't make every other color option disappear.
  const facets = {
    colors: deriveColorFacets(allViewProducts),
    sizes: deriveSizeFacets(allViewProducts),
  }

  const activeFilters = parseProductFilters(params)
  const viewProducts = applyProductFilters(allViewProducts, activeFilters)

  const totalPages = Math.max(1, Math.ceil(viewProducts.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages)
  const pageItems = viewProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const Theme = getTheme(config?.template_id)
  return (
    <Theme.Shop
      config={config}
      cartCount={cartCount}
      products={pageItems}
      categories={categories}
      collections={collections}
      activeCategory={activeCategory}
      page={page}
      totalPages={totalPages}
      totalCount={viewProducts.length}
      filters={activeFilters}
      facets={facets}
    />
  )
}
