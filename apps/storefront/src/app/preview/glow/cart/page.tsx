import { resolveTenant } from "../../../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../../../lib/store-config"
import { CartClient } from "./_cart-client"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null
  return <CartClient config={config} />
}
