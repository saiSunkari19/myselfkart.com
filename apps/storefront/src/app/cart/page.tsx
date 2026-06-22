import { StorefrontStatePage } from "../../components/storefront-state"
import { getTheme } from "../../lib/themes"
import { getCartId } from "../../lib/cart/cookie"
import { getCart } from "../../lib/medusa/cart"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") {
    return <StorefrontStatePage state="not-found" />
  }

  const cartId = await getCartId()
  const [cart, config] = await Promise.all([
    cartId ? getCart(tenant, cartId) : Promise.resolve(null),
    fetchStoreConfig(tenant),
  ])

  const cartCount = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0

  const Theme = getTheme(config?.template_id)
  return <Theme.Cart config={config} cart={cart} cartCount={cartCount} />
}
