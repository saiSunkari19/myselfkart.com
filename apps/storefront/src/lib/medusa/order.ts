import "server-only"

import { getTenantMedusa } from "./client"
import type { TenantResolution } from "../tenant/types"

export type StoreOrder = {
  id: string
  display_id: number
  email: string | null
  currency_code: string
  total: number
  items: { id: string; title: string; quantity: number; total: number }[]
}

const ORDER_FIELDS =
  "id,display_id,email,currency_code,total,*items"

/**
 * Retrieves a completed order for the resolved tenant. RLS scopes the order to
 * the tenant, so another tenant's order id resolves to null here.
 */
export async function getTenantOrder(
  tenant: TenantResolution,
  orderId: string
): Promise<StoreOrder | null> {
  const sdk = getTenantMedusa(tenant)
  try {
    const { order } = await sdk.store.order.retrieve(orderId, {
      fields: ORDER_FIELDS,
    })
    return order as unknown as StoreOrder
  } catch {
    return null
  }
}
