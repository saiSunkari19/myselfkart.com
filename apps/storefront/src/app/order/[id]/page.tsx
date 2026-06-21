import { notFound } from "next/navigation"

import { getTheme } from "../../../lib/themes"
import { getTenantOrder } from "../../../lib/medusa/order"
import { resolveTenant } from "../../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../../lib/store-config"

export const dynamic = "force-dynamic"

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await resolveTenant()

  // RLS scopes the order to the tenant: another tenant's order id is not found
  // under this host, so it 404s rather than leaking.
  if (!tenant || tenant.status !== "active") {
    notFound()
  }

  const [order, config] = await Promise.all([
    getTenantOrder(tenant, id),
    fetchStoreConfig(tenant),
  ])
  if (!order) {
    notFound()
  }

  const Theme = getTheme(config?.template_id)
  return <Theme.Order config={config} order={order} />
}
