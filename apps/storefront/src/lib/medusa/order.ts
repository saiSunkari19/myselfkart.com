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
  /** Medusa's three independent status fields, used to derive a live label. */
  status: string | null
  fulfillment_status: string | null
  payment_status: string | null
  items: StoreOrderItem[]
}

// `*items` is required for the line-item computed fields (total/quantity/etc.)
// to resolve — narrowing to explicit `items.total` returns 0. The nested
// product handle is added on top so each line can link back to its PDP.
// The status fields let the confirmation page show the order's *live* state
// (shipped/delivered/cancelled) instead of a hard-coded "confirmed".
const ORDER_FIELDS =
  "id,display_id,email,currency_code,total,status,fulfillment_status,payment_status,*items,items.product.handle"

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
      status: raw.status ?? null,
      fulfillment_status: raw.fulfillment_status ?? null,
      payment_status: raw.payment_status ?? null,
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
