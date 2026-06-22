import { StorefrontStatePage } from "../../components/storefront-state"
import { getTheme } from "../../lib/themes"
import { mapProducts } from "../../lib/views"
import { getDeals } from "../../lib/merchandising"
import { listTenantProducts } from "../../lib/medusa/products"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"
import { getCartItemCount } from "../../lib/cart/item-count"

export const dynamic = "force-dynamic"

export default async function DealsPage() {
  const tenant = await resolveTenant()

  if (!tenant) return <StorefrontStatePage state="not-found" />
  if (tenant.status === "draft") return <StorefrontStatePage state="draft" />
  if (tenant.status === "suspended") return <StorefrontStatePage state="suspended" />

  const [products, config, cartCount] = await Promise.all([
    listTenantProducts(tenant),
    fetchStoreConfig(tenant),
    getCartItemCount(tenant),
  ])

  const Theme = getTheme(config?.template_id)
  return <Theme.Deals config={config} cartCount={cartCount} deals={mapProducts(getDeals(products))} />
}
