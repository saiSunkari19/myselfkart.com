import "server-only"

import { getTenantMedusa } from "./client"
import { getRegion } from "./region"
import type { TenantResolution } from "../tenant/types"

export type StoreVariant = {
  id: string
  title: string | null
  calculated_price: {
    calculated_amount: number | null
    currency_code: string | null
  } | null
}

export type StoreProduct = {
  id: string
  title: string
  handle: string | null
  thumbnail: string | null
  description: string | null
  variants: StoreVariant[]
}

// calculated_price requires a region_id on the query so Medusa can resolve the
// price for that region's currency. The price is in major units (e.g. 49.99) —
// render it directly, never divide by 100.
const PRODUCT_FIELDS =
  "id,title,handle,thumbnail,description,*variants,variants.calculated_price"

/**
 * Lists products for the resolved tenant. The per-tenant SDK attaches the
 * tenant's publishable key (sales-channel scoping) and the signed tenant
 * headers (RLS scoping), so this can only ever return that tenant's products.
 */
export async function listTenantProducts(
  tenant: TenantResolution
): Promise<StoreProduct[]> {
  const sdk = getTenantMedusa(tenant)
  const region = await getRegion(tenant)
  const { products } = await sdk.store.product.list({
    limit: 100,
    fields: PRODUCT_FIELDS,
    region_id: region?.id,
  })
  return products as unknown as StoreProduct[]
}

export async function getTenantProductByHandle(
  tenant: TenantResolution,
  handle: string
): Promise<StoreProduct | null> {
  const sdk = getTenantMedusa(tenant)
  const region = await getRegion(tenant)
  const { products } = await sdk.store.product.list({
    handle,
    limit: 1,
    fields: PRODUCT_FIELDS,
    region_id: region?.id,
  })
  return (products[0] as unknown as StoreProduct) ?? null
}
