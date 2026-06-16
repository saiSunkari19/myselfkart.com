import "server-only"

import { getTenantMedusa } from "./client"
import type { TenantResolution } from "../tenant/types"

export type StoreProduct = {
  id: string
  title: string
  handle: string | null
  thumbnail: string | null
  description: string | null
}

const PRODUCT_FIELDS = "id,title,handle,thumbnail,description"

/**
 * Lists products for the resolved tenant. The per-tenant SDK attaches the
 * tenant's publishable key (sales-channel scoping) and the signed tenant
 * headers (RLS scoping), so this can only ever return that tenant's products.
 */
export async function listTenantProducts(
  tenant: TenantResolution
): Promise<StoreProduct[]> {
  const sdk = getTenantMedusa(tenant)
  const { products } = await sdk.store.product.list({
    limit: 100,
    fields: PRODUCT_FIELDS,
  })
  return products as StoreProduct[]
}

export async function getTenantProductByHandle(
  tenant: TenantResolution,
  handle: string
): Promise<StoreProduct | null> {
  const sdk = getTenantMedusa(tenant)
  const { products } = await sdk.store.product.list({
    handle,
    limit: 1,
    fields: PRODUCT_FIELDS,
  })
  return (products[0] as StoreProduct) ?? null
}
