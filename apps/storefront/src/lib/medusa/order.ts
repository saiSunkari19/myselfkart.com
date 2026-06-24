import "server-only"

import { getTenantMedusa } from "./client"
import { getCustomerToken } from "../customer/cookie"
import type { TenantResolution } from "../tenant/types"

export type StoreOrderItem = {
  id: string
  title: string
  quantity: number
  total: number
  /** Line-item thumbnail, or null. */
  thumbnail: string | null
  /** Product slug for linking back to the PDP, or null. */
  handle: string | null
}

export type StoreOrder = {
  id: string
  display_id: number
  email: string | null
  currency_code: string
  total: number
  items: StoreOrderItem[]
}

const ORDER_FIELDS =
  "id,display_id,email,currency_code,total," +
  "items.id,items.title,items.quantity,items.total,items.thumbnail,items.product_id,items.product.handle"

type RawOrderItem = {
  id: string
  title: string
  quantity: number
  total: number
  thumbnail?: string | null
  product?: { handle?: string | null } | null
}

/**
 * Retrieves a completed order for the resolved tenant. RLS scopes the order to
 * the tenant, so another tenant's order id resolves to null here. The signed-in
 * customer's token is attached when present so Medusa authorises viewing the
 * order from the account history; guest order-confirmation (no token) still
 * resolves by id.
 */
export async function getTenantOrder(
  tenant: TenantResolution,
  orderId: string
): Promise<StoreOrder | null> {
  const token = await getCustomerToken()
  const sdk = getTenantMedusa(tenant, token)
  try {
    const { order } = await sdk.store.order.retrieve(orderId, {
      fields: ORDER_FIELDS,
    })
    const raw = order as unknown as Omit<StoreOrder, "items"> & { items: RawOrderItem[] }
    return {
      ...raw,
      items: (raw.items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        total: item.total,
        thumbnail: item.thumbnail ?? null,
        handle: item.product?.handle ?? null,
      })),
    }
  } catch {
    return null
  }
}
