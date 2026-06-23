import "server-only"

import { getTenantMedusa } from "./client"
import { getRegion } from "./region"
import type { TenantResolution } from "../tenant/types"

export type StoreVariant = {
  id: string
  title: string | null
  calculated_price: {
    calculated_amount: number | null
    // original_amount > calculated_amount means an active sale/price-list — this
    // is how we detect a *real* deal rather than fabricating discounts.
    original_amount: number | null
    currency_code: string | null
  } | null
}

export type StoreTag = {
  id: string
  value: string
}

export type StoreCategory = {
  id: string
  name: string
  handle: string | null
}

export type StoreProductImage = {
  url: string
}

export type StoreProduct = {
  id: string
  title: string
  handle: string | null
  thumbnail: string | null
  // Full gallery, separate from `thumbnail` — Medusa sellers often set several
  // photos per product. Empty when the seller only ever set a thumbnail.
  images: StoreProductImage[]
  description: string | null
  created_at: string | null
  tags: StoreTag[]
  // Real Medusa product categories assigned to this product. Empty when the
  // seller hasn't set up categories — the browse nav then falls back to tags.
  categories: StoreCategory[]
  variants: StoreVariant[]
}

// calculated_price requires a region_id on the query so Medusa can resolve the
// price for that region's currency. The price is in major units (e.g. 49.99) —
// render it directly, never divide by 100.
const PRODUCT_FIELDS =
  "id,title,handle,thumbnail,images.url,description,created_at,*tags,categories.id,categories.name,categories.handle,*variants,variants.calculated_price"

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

/**
 * Per-variant stock, keyed by variant id. `inventory_quantity` is injected by
 * a dedicated middleware that ONLY runs on `/store/products` routes (resolved
 * against the request's sales channel) — it does not resolve through any
 * other endpoint's field selection, including the cart's nested
 * `items.variant.*`. Fetching it here, by product id, is the only place it
 * actually works.
 */
export async function getVariantAvailability(
  tenant: TenantResolution,
  productIds: string[]
): Promise<Record<string, { availableQuantity: number | null }>> {
  if (productIds.length === 0) return {}
  const sdk = getTenantMedusa(tenant)
  const { products } = await sdk.store.product.list({
    id: productIds,
    limit: productIds.length,
    fields: "id,variants.id,variants.inventory_quantity,variants.manage_inventory,variants.allow_backorder",
  })
  const out: Record<string, { availableQuantity: number | null }> = {}
  for (const product of products as unknown as {
    variants?: { id: string; inventory_quantity?: number | null; manage_inventory?: boolean | null; allow_backorder?: boolean | null }[]
  }[]) {
    for (const variant of product.variants ?? []) {
      const unlimited =
        variant.manage_inventory === false ||
        variant.allow_backorder === true ||
        variant.inventory_quantity == null
      out[variant.id] = { availableQuantity: unlimited ? null : variant.inventory_quantity! }
    }
  }
  return out
}
