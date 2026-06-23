import "server-only"

import { getCartId } from "./cookie"
import { getCart } from "../medusa/cart"
import type { TenantResolution } from "../tenant/types"

/** Total item quantity in the current visitor's cart, for the nav badge. */
export async function getCartItemCount(tenant: TenantResolution): Promise<number> {
  const cartId = await getCartId()
  if (!cartId) return 0
  const cart = await getCart(tenant, cartId)
  return cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0
}
