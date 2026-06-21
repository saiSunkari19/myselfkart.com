import { notFound } from "next/navigation"

import { getTheme } from "../../../lib/themes"
import { mapProduct, mapProducts } from "../../../lib/views"
import {
  getTenantProductByHandle,
  listTenantProducts,
} from "../../../lib/medusa/products"
import { resolveTenant } from "../../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../../lib/store-config"

export const dynamic = "force-dynamic"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const tenant = await resolveTenant()

  // Only an active tenant renders products; everything else is "not found" so a
  // foreign tenant's handle can never resolve into this store.
  if (!tenant || tenant.status !== "active") {
    notFound()
  }

  const [product, config, all] = await Promise.all([
    getTenantProductByHandle(tenant, handle),
    fetchStoreConfig(tenant),
    listTenantProducts(tenant),
  ])
  if (!product) {
    notFound()
  }

  // Related = other products sharing a tag, falling back to any others.
  const tagIds = new Set((product.tags ?? []).map(t => t.id))
  const others = all.filter(p => p.id !== product.id)
  const sameTag = others.filter(p => (p.tags ?? []).some(t => tagIds.has(t.id)))
  const related = (sameTag.length > 0 ? sameTag : others).slice(0, 4)

  const Theme = getTheme(config?.template_id)
  return (
    <Theme.PDP
      config={config}
      product={mapProduct(product)}
      variants={product.variants ?? []}
      related={mapProducts(related)}
    />
  )
}
