import { StorefrontStatePage } from "../../components/storefront-state"
import { getTheme } from "../../lib/themes"
import { mapProducts, resolveCategories, filterByCategory } from "../../lib/views"
import { listTenantProducts } from "../../lib/medusa/products"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"
import { getCartItemCount } from "../../lib/cart/item-count"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 24

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}) {
  const tenant = await resolveTenant()

  if (!tenant) return <StorefrontStatePage state="not-found" />
  if (tenant.status === "draft") return <StorefrontStatePage state="draft" />
  if (tenant.status === "suspended") return <StorefrontStatePage state="suspended" />

  const [{ category, q, page: pageParam }, [products, config, cartCount]] = await Promise.all([
    searchParams,
    Promise.all([listTenantProducts(tenant), fetchStoreConfig(tenant), getCartItemCount(tenant)]),
  ])

  const categories = resolveCategories(products)
  const activeCategory = category && categories.some(c => c.id === category) ? category : null
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages)
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const Theme = getTheme(config?.template_id)
  return (
    <Theme.Shop
      config={config}
      cartCount={cartCount}
      products={mapProducts(pageItems)}
      categories={categories}
      activeCategory={activeCategory}
      page={page}
      totalPages={totalPages}
      totalCount={filtered.length}
    />
  )
}
