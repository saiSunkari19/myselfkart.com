import "server-only"

import { getTenantMedusa } from "./client"
import type { Cart } from "./cart"
import type { TenantResolution } from "../tenant/types"

export const RAZORPAY_PROVIDER_ID = "pp_razorpay_razorpay"
export const MANUAL_PROVIDER_ID = "pp_system_default"

/** Tenant payment config the checkout UI needs. `razorpay` set only when ready. */
export type StorePaymentConfig = {
  razorpay: {
    provider_id: string
    key_id: string
    mode: "test" | "live"
  } | null
}

/** Everything the client Razorpay widget needs to open the checkout modal. */
export type RazorpaySession = {
  key_id: string
  order_id: string
  amount: number // smallest currency unit (paise)
  currency: string
}

/**
 * Reads the tenant's enabled payment methods. Razorpay is non-null only when the
 * seller has configured + enabled it (the backend gates on
 * tenant_payment_credentials), so the storefront can decide what to render.
 */
export async function getPaymentConfig(
  tenant: TenantResolution
): Promise<StorePaymentConfig> {
  const sdk = getTenantMedusa(tenant)
  try {
    return await sdk.client.fetch<StorePaymentConfig>(
      "/store/selfkart/payment-config"
    )
  } catch {
    return { razorpay: null }
  }
}

/**
 * Creates (or reuses) the Razorpay payment session for a cart and returns the
 * data the browser widget needs. The backend provider creates a Razorpay order
 * scoped to this tenant's account and stores its public details on the session.
 */
export async function initiateRazorpaySession(
  tenant: TenantResolution,
  cart: Cart
): Promise<RazorpaySession> {
  const sdk = getTenantMedusa(tenant)
  const { payment_collection } = await sdk.store.payment.initiatePaymentSession(
    cart as never,
    { provider_id: RAZORPAY_PROVIDER_ID }
  )

  const session = (payment_collection?.payment_sessions ?? []).find(
    (s: { provider_id: string }) => s.provider_id === RAZORPAY_PROVIDER_ID
  ) as { data?: Record<string, unknown> } | undefined

  const data = session?.data ?? {}
  const orderId = data.razorpay_order_id as string | undefined
  const keyId = data.key_id as string | undefined
  const amount = data.amount as number | undefined
  const currency = data.currency as string | undefined

  if (!orderId || !keyId || !amount || !currency) {
    throw new Error("Could not start the Razorpay payment. Please try again.")
  }

  return { key_id: keyId, order_id: orderId, amount, currency }
}
