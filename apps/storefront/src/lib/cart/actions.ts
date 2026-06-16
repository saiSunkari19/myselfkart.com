"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  addLineItem,
  addShippingMethod,
  completeCart,
  createCart,
  deleteLineItem,
  getCart,
  initiatePayment,
  setCustomerDetails,
  updateLineItem,
  type CartAddress,
} from "../medusa/cart"
import { getRegion } from "../medusa/region"
import { resolveTenant } from "../tenant/resolve-tenant"
import type { TenantResolution } from "../tenant/types"
import { clearCartId, getCartId, setCartId } from "./cookie"

async function requireActiveTenant(): Promise<TenantResolution> {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") {
    // No active store for this host: nothing to transact against.
    redirect("/")
  }
  return tenant
}

/** Returns the current cart id, creating a cart (in the shared region) if none. */
async function ensureCartId(tenant: TenantResolution): Promise<string> {
  const existing = await getCartId()
  if (existing) {
    return existing
  }
  const region = await getRegion(tenant)
  if (!region) {
    throw new Error("No region is configured for this store")
  }
  const cart = await createCart(tenant, region.id)
  await setCartId(cart.id)
  return cart.id
}

export async function addToCartAction(formData: FormData): Promise<void> {
  const tenant = await requireActiveTenant()
  const variantId = String(formData.get("variant_id") ?? "")
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1))
  if (!variantId) {
    return
  }

  const cartId = await ensureCartId(tenant)
  await addLineItem(tenant, cartId, variantId, quantity)
  revalidatePath("/cart")
  redirect("/cart")
}

export async function updateLineItemAction(formData: FormData): Promise<void> {
  const tenant = await requireActiveTenant()
  const cartId = await getCartId()
  const lineItemId = String(formData.get("line_item_id") ?? "")
  const quantity = Number(formData.get("quantity") ?? 0)
  if (!cartId || !lineItemId) {
    return
  }

  if (quantity <= 0) {
    await deleteLineItem(tenant, cartId, lineItemId)
  } else {
    await updateLineItem(tenant, cartId, lineItemId, quantity)
  }
  revalidatePath("/cart")
}

export async function removeLineItemAction(formData: FormData): Promise<void> {
  const tenant = await requireActiveTenant()
  const cartId = await getCartId()
  const lineItemId = String(formData.get("line_item_id") ?? "")
  if (!cartId || !lineItemId) {
    return
  }
  await deleteLineItem(tenant, cartId, lineItemId)
  revalidatePath("/cart")
}

export async function setAddressAction(formData: FormData): Promise<void> {
  const tenant = await requireActiveTenant()
  const cartId = await getCartId()
  if (!cartId) {
    redirect("/cart")
  }

  const email = String(formData.get("email") ?? "").trim()
  const address: CartAddress = {
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    address_1: String(formData.get("address_1") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    province: String(formData.get("province") ?? "").trim() || undefined,
    postal_code: String(formData.get("postal_code") ?? "").trim(),
    country_code: String(formData.get("country_code") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
  }

  await setCustomerDetails(tenant, cartId, email, address)
  revalidatePath("/checkout")
}

export async function setShippingMethodAction(formData: FormData): Promise<void> {
  const tenant = await requireActiveTenant()
  const cartId = await getCartId()
  const optionId = String(formData.get("option_id") ?? "")
  if (!cartId || !optionId) {
    redirect("/checkout")
  }
  await addShippingMethod(tenant, cartId, optionId)
  revalidatePath("/checkout")
}

export async function placeOrderAction(): Promise<void> {
  const tenant = await requireActiveTenant()
  const cartId = await getCartId()
  if (!cartId) {
    redirect("/cart")
  }

  // Fetch the cart with its payment_collection so the manual session attaches to
  // the existing collection rather than creating a duplicate.
  const cart = await getCart(tenant, cartId)
  if (!cart) {
    redirect("/cart")
  }

  await initiatePayment(tenant, cart)
  const result = await completeCart(tenant, cartId)

  if (result.type === "order") {
    await clearCartId()
    redirect(`/order/${result.orderId}`)
  }

  redirect(`/checkout?error=${encodeURIComponent(result.message)}`)
}
