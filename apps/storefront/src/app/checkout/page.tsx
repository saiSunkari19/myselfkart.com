import { redirect } from "next/navigation"

import { StorefrontStatePage } from "../../components/storefront-state"
import { getTheme } from "../../lib/themes"
import { getCartId } from "../../lib/cart/cookie"
import { getCustomerToken } from "../../lib/customer/cookie"
import { getCurrentCustomer, listCustomerAddresses } from "../../lib/medusa/customer"
import { getCart, listShippingOptions } from "../../lib/medusa/cart"
import { getTenantMedusa } from "../../lib/medusa/client"
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

  // Login gate: checkout requires a signed-in customer (per-store account).
  const token = await getCustomerToken()
  const customer = await getCurrentCustomer(tenant, token)
  if (!customer) {
    redirect("/login?next=/checkout")
  }

  const { error } = await searchParams
  const cartId = await getCartId()

  // Tie the (guest) cart to the customer so the resulting order is on their
  // account. Best-effort + idempotent; never blocks rendering.
  if (cartId && token) {
    try {
      await getTenantMedusa(tenant, token).client.fetch(`/store/carts/${cartId}/customer`, {
        method: "POST",
      })
    } catch {
      /* ignore */
    }
  }

  const [cart, config, savedAddresses] = await Promise.all([
    cartId ? getCart(tenant, cartId) : Promise.resolve(null),
    fetchStoreConfig(tenant),
    listCustomerAddresses(tenant, token),
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
      customer={customer}
      savedAddresses={savedAddresses}
    />
  )
}
