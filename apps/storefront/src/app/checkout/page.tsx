import { StorefrontStatePage } from "../../components/storefront-state"
import { getTheme } from "../../lib/themes"
import { getCartId } from "../../lib/cart/cookie"
import { getCart, listShippingOptions } from "../../lib/medusa/cart"
import { getPaymentConfig } from "../../lib/medusa/payment"
import { getRegion } from "../../lib/medusa/region"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"

export const dynamic = "force-dynamic"

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") {
    return <StorefrontStatePage state="not-found" />
  }

  const { error } = await searchParams
  const cartId = await getCartId()
  const [cart, config] = await Promise.all([
    cartId ? getCart(tenant, cartId) : Promise.resolve(null),
    fetchStoreConfig(tenant),
  ])

  const hasAddress = Boolean(cart?.shipping_address)
  const [shippingOptions, region, paymentConfig] = await Promise.all([
    hasAddress && cart ? listShippingOptions(tenant, cart.id) : Promise.resolve([]),
    getRegion(tenant),
    getPaymentConfig(tenant),
  ])

  const Theme = getTheme(config?.template_id)
  return (
    <Theme.Checkout
      config={config}
      cart={cart}
      shippingOptions={shippingOptions}
      countries={region?.countries ?? []}
      hasRazorpay={Boolean(paymentConfig.razorpay)}
      error={error ?? null}
    />
  )
}
