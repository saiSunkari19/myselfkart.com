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
import { createCustomerAddress, listCustomerAddresses } from "../medusa/customer"
import { getCustomerToken } from "../customer/cookie"
import {
  getPaymentConfig,
  initiateRazorpaySession,
  type RazorpaySession,
  type StorePaymentConfig,
} from "../medusa/payment"
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
    // Don't trust the cookie blindly: a completed, deleted, expired, or
    // reseeded cart id lingers in the 30-day cookie and would otherwise make
    // every add-to-cart 404 against /store/carts/<gone>/line-items with no way
    // to recover. Verify it still resolves for this tenant; drop it if not.
    const cart = await getCart(tenant, existing)
    if (cart) {
      return existing
    }
    await clearCartId()
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
  const requestedQuantity = Number(formData.get("quantity") ?? 0)
  if (!cartId || !lineItemId) {
    return
  }

  if (requestedQuantity <= 0) {
    await deleteLineItem(tenant, cartId, lineItemId)
    revalidatePath("/cart")
    redirect("/cart")
  }

  // Clamp to remaining stock so an over-eager +/- click (or a stale quantity
  // typed into the input) never reaches Medusa as an invalid update — Medusa
  // would reject it outright, surfacing as an unhandled error to the shopper.
  const cart = await getCart(tenant, cartId)
  const item = cart?.items.find(i => i.id === lineItemId)
  const max = item?.availableQuantity == null ? Infinity : item.quantity + item.availableQuantity
  const quantity = Math.min(requestedQuantity, max)

  await updateLineItem(tenant, cartId, lineItemId, quantity)
  // Redirect (not just revalidate) so the cart re-renders fresh — mirrors
  // addToCartAction. A bare revalidatePath leaves the themed cart's uncontrolled
  // quantity <input> showing the typed/clicked value while the totals look
  // unchanged, which reads as "the +/- buttons do nothing".
  revalidatePath("/cart")
  redirect("/cart")
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
  redirect("/cart")
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

  // Mirror the checkout address into the signed-in customer's address book so it
  // appears under Account → Addresses and can be reused next time. Deduped by
  // street + postal code, and best-effort: a failure here must never block the
  // checkout (the cart already has the address it needs).
  const token = await getCustomerToken()
  if (token) {
    try {
      const sig = (a: { address_1?: string | null; postal_code?: string | null }) =>
        `${(a.address_1 ?? "").trim().toLowerCase()}|${(a.postal_code ?? "").trim()}`
      const newSig = sig({ address_1: address.address_1, postal_code: address.postal_code })
      const existing = await listCustomerAddresses(tenant, token)
      if (!existing.some((a) => sig(a) === newSig)) {
        await createCustomerAddress(tenant, token, {
          first_name: address.first_name,
          last_name: address.last_name,
          address_1: address.address_1,
          city: address.city,
          province: address.province,
          postal_code: address.postal_code,
          country_code: address.country_code,
          phone: address.phone,
        })
        revalidatePath("/account/addresses")
      }
    } catch {
      /* best-effort: never block checkout on address-book sync */
    }
  }

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

/**
 * Starts a Razorpay checkout: creates the per-tenant Razorpay order/session and
 * returns the public data the browser widget needs. Called from the client
 * Razorpay component (which then opens the Razorpay modal).
 */
export async function startRazorpayCheckoutAction(): Promise<
  { ok: true; session: RazorpaySession } | { ok: false; error: string }
> {
  const tenant = await requireActiveTenant()
  const cartId = await getCartId()
  if (!cartId) {
    return { ok: false, error: "Your cart could not be found." }
  }

  const cart = await getCart(tenant, cartId)
  if (!cart) {
    return { ok: false, error: "Your cart could not be found." }
  }
  if (!cart.shipping_address || cart.shipping_methods.length === 0) {
    return {
      ok: false,
      error: "Add your shipping details and a delivery method first.",
    }
  }

  try {
    const session = await initiateRazorpaySession(tenant, cart)
    return { ok: true, session }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not start the payment.",
    }
  }
}

/**
 * Completes the cart after the buyer has paid in the Razorpay modal. The backend
 * provider authorizes by checking Razorpay directly (it does not trust the
 * browser), so a failed/incomplete payment can't produce an order here.
 */
export async function completeRazorpayOrderAction(): Promise<
  { ok: true; orderId: string } | { ok: false; error: string }
> {
  const tenant = await requireActiveTenant()
  const cartId = await getCartId()
  if (!cartId) {
    return { ok: false, error: "Your cart could not be found." }
  }

  const result = await completeCart(tenant, cartId)
  if (result.type === "order") {
    await clearCartId()
    return { ok: true, orderId: result.orderId }
  }
  return { ok: false, error: result.message }
}

/** Checks if Razorpay is configured and enabled for the current store tenant. */
export async function getPaymentSetupAction(): Promise<StorePaymentConfig> {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") return { razorpay: null }
  return getPaymentConfig(tenant)
}
