import { resolveTenant } from "../../../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../../../lib/store-config"
import { AboutClient } from "./_about-client"

export const dynamic = "force-dynamic"

export default async function AboutPage() {
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null
  return <AboutClient config={config} />
}
