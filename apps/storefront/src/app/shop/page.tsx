import { StorefrontStatePage } from "../../components/storefront-state"
import { getTheme } from "../../lib/themes"
import { mapProducts, resolveCategories, filterByCategory } from "../../lib/views"
import { listTenantProducts } from "../../lib/medusa/products"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"

export const dynamic = "force-dynamic"

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const tenant = await resolveTenant()

  if (!tenant) return <StorefrontStatePage state="not-found" />
  if (tenant.status === "draft") return <StorefrontStatePage state="draft" />
  if (tenant.status === "suspended") return <StorefrontStatePage state="suspended" />

  const [{ category, q }, [products, config]] = await Promise.all([
    searchParams,
    Promise.all([listTenantProducts(tenant), fetchStoreConfig(tenant)]),
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

  const Theme = getTheme(config?.template_id)
  return (
    <Theme.Shop
      config={config}
      products={mapProducts(filtered)}
      categories={categories}
      activeCategory={activeCategory}
    />
  )
}
