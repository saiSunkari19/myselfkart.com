import { resolveTenant } from "../../../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../../../lib/store-config"
import { CheckoutClient } from "./_checkout-client"

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null
  return <CheckoutClient config={config} />
}
