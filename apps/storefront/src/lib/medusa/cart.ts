import "server-only"

import { getTenantMedusa } from "./client"
import type { TenantResolution } from "../tenant/types"

export type CartAddress = {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
}

export type CartLineItem = {
  id: string
  title: string
  quantity: number
  unit_price: number
  total: number
  thumbnail: string | null
  product_title: string | null
  variant_title: string | null
  /**
   * Remaining units the variant's stock allows for this line item, or
   * `null` when stock isn't tracked (`manage_inventory: false`) or
   * backorders are allowed — i.e. there's no real cap to enforce.
   */
  availableQuantity: number | null
}

type RawCartLineItem = Omit<CartLineItem, "availableQuantity"> & {
  variant?: {
    inventory_quantity?: number | null
    manage_inventory?: boolean | null
    allow_backorder?: boolean | null
  } | null
}

export type CartShippingMethod = {
  id: string
  name: string
  amount: number
}

export type Cart = {
  id: string
  email: string | null
  currency_code: string
  items: CartLineItem[]
  shipping_methods: CartShippingMethod[]
  shipping_address: CartAddress | null
  total: number
  subtotal: number
  shipping_total: number
  tax_total: number
  payment_collection: {
    id: string
    payment_sessions?: { id: string; provider_id: string; status: string }[]
  } | null
}

export type ShippingOption = {
  id: string
  name: string
  amount: number | null
}

// Everything the cart/checkout pages need in one round-trip. Amounts are major
// units — render directly, never divide by 100. inventory_quantity is a
// computed field — `*items.variant` alone doesn't include it, same reason
// `PRODUCT_FIELDS` explicitly requests `variants.calculated_price`.
const CART_FIELDS =
  "id,email,currency_code,total,subtotal,tax_total,shipping_total,item_total," +
  "*items,*items.product,*items.variant,items.variant.inventory_quantity," +
  "items.variant.manage_inventory,items.variant.allow_backorder," +
  "*shipping_address,*billing_address," +
  "*shipping_methods,*payment_collection,*payment_collection.payment_sessions"

function asCart(cart: unknown): Cart {
  const raw = cart as Omit<Cart, "items"> & { items: RawCartLineItem[] }
  return {
    ...raw,
    items: raw.items.map(item => {
      const variant = item.variant
      const unlimited = !variant || variant.manage_inventory === false || variant.allow_backorder === true
      const { variant: _variant, ...rest } = item
      return {
        ...rest,
        availableQuantity: unlimited ? null : variant?.inventory_quantity ?? 0,
      }
    }),
  }
}

export async function createCart(
  tenant: TenantResolution,
  regionId: string
): Promise<Cart> {
  const sdk = getTenantMedusa(tenant)
  const { cart } = await sdk.store.cart.create({ region_id: regionId })
  return asCart(cart)
}

export async function getCart(
  tenant: TenantResolution,
  cartId: string
): Promise<Cart | null> {
  const sdk = getTenantMedusa(tenant)
  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, { fields: CART_FIELDS })
    return asCart(cart)
  } catch {
    // Unknown / foreign / completed cart: RLS + sales-channel scoping mean a
    // cart from another tenant simply isn't found here.
    return null
  }
}

export async function addLineItem(
  tenant: TenantResolution,
  cartId: string,
  variantId: string,
  quantity: number
): Promise<Cart> {
  const sdk = getTenantMedusa(tenant)
  const { cart } = await sdk.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
  })
  return asCart(cart)
}

export async function updateLineItem(
  tenant: TenantResolution,
  cartId: string,
  lineItemId: string,
  quantity: number
): Promise<Cart> {
  const sdk = getTenantMedusa(tenant)
  const { cart } = await sdk.store.cart.updateLineItem(cartId, lineItemId, {
    quantity,
  })
  return asCart(cart)
}

export async function deleteLineItem(
  tenant: TenantResolution,
  cartId: string,
  lineItemId: string
): Promise<void> {
  const sdk = getTenantMedusa(tenant)
  await sdk.store.cart.deleteLineItem(cartId, lineItemId)
}

export async function setCustomerDetails(
  tenant: TenantResolution,
  cartId: string,
  email: string,
  address: CartAddress
): Promise<Cart> {
  const sdk = getTenantMedusa(tenant)
  const { cart } = await sdk.store.cart.update(cartId, {
    email,
    shipping_address: address,
    billing_address: address,
  })
  return asCart(cart)
}

export async function listShippingOptions(
  tenant: TenantResolution,
  cartId: string
): Promise<ShippingOption[]> {
  const sdk = getTenantMedusa(tenant)
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
    cart_id: cartId,
  })
  return (shipping_options ?? []) as unknown as ShippingOption[]
}

export async function addShippingMethod(
  tenant: TenantResolution,
  cartId: string,
  optionId: string
): Promise<Cart> {
  const sdk = getTenantMedusa(tenant)
  const { cart } = await sdk.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
  })
  return asCart(cart)
}

const MANUAL_PAYMENT_PROVIDER_ID = "pp_system_default"

export async function initiatePayment(
  tenant: TenantResolution,
  cart: Cart
): Promise<void> {
  const sdk = getTenantMedusa(tenant)
  // initiatePaymentSession reads cart.payment_collection to attach the session,
  // creating the collection if absent — pass a cart fetched with CART_FIELDS.
  await sdk.store.payment.initiatePaymentSession(cart as never, {
    provider_id: MANUAL_PAYMENT_PROVIDER_ID,
  })
}

export type CompleteResult =
  | { type: "order"; orderId: string }
  | { type: "error"; message: string }

export async function completeCart(
  tenant: TenantResolution,
  cartId: string
): Promise<CompleteResult> {
  const sdk = getTenantMedusa(tenant)
  const res = await sdk.store.cart.complete(cartId)
  if (res.type === "order") {
    return { type: "order", orderId: res.order.id }
  }
  return {
    type: "error",
    message: res.error?.message ?? "Could not place the order.",
  }
}
