import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Minimal Razorpay REST client (no SDK dependency — plain fetch + Basic auth).
 *
 * Every call is bound to a SINGLE tenant's key pair: the provider service builds
 * a fresh client per request from that tenant's decrypted credentials, so two
 * sellers' Razorpay accounts never share a client instance.
 *
 * Amounts on the wire are in the currency's smallest unit (paise for INR), i.e.
 * Medusa's major-unit amount × 100. Helpers here take/return smallest-unit ints.
 */

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1"

export type RazorpayMode = "test" | "live"

export type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  status: string
  receipt?: string | null
  notes?: Record<string, string>
}

export type RazorpayPayment = {
  id: string
  order_id: string | null
  status:
    | "created"
    | "authorized"
    | "captured"
    | "refunded"
    | "failed"
    | string
  amount: number
  currency: string
  method?: string
}

export class RazorpayClient {
  constructor(
    private readonly keyId: string,
    private readonly keySecret: string
  ) {}

  private authHeader(): string {
    const token = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
      "base64"
    )
    return `Basic ${token}`
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: this.authHeader(),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await res.text()
    const json = text ? JSON.parse(text) : {}

    if (!res.ok) {
      const message =
        (json as { error?: { description?: string } })?.error?.description ||
        `Razorpay request failed (${res.status})`
      throw new Error(message)
    }

    return json as T
  }

  /** Creates an order with auto-capture so a successful payment is captured. */
  async createOrder(input: {
    amount: number
    currency: string
    receipt?: string
    notes?: Record<string, string>
  }): Promise<RazorpayOrder> {
    return this.request<RazorpayOrder>("POST", "/orders", {
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes ?? {},
      payment_capture: 1,
    })
  }

  async getOrder(orderId: string): Promise<RazorpayOrder> {
    return this.request<RazorpayOrder>("GET", `/orders/${orderId}`)
  }

  /** Lists payments made against an order — the source of truth for authorize. */
  async getOrderPayments(orderId: string): Promise<RazorpayPayment[]> {
    const res = await this.request<{ items: RazorpayPayment[] }>(
      "GET",
      `/orders/${orderId}/payments`
    )
    return res.items ?? []
  }

  async getPayment(paymentId: string): Promise<RazorpayPayment> {
    return this.request<RazorpayPayment>("GET", `/payments/${paymentId}`)
  }

  async capturePayment(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<RazorpayPayment> {
    return this.request<RazorpayPayment>(
      "POST",
      `/payments/${paymentId}/capture`,
      { amount, currency }
    )
  }

  async refundPayment(
    paymentId: string,
    amount: number
  ): Promise<{ id: string; payment_id: string; amount: number; status: string }> {
    return this.request("POST", `/payments/${paymentId}/refund`, { amount })
  }
}

/** Razorpay amount unit = major-unit × 100 (paise), rounded to a whole int. */
export function toSmallestUnit(majorAmount: number): number {
  return Math.round(majorAmount * 100)
}

/**
 * Verifies a Razorpay webhook signature: HMAC-SHA256 of the raw request body
 * keyed by the tenant's webhook secret, compared in constant time.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | undefined,
  webhookSecret: string
): boolean {
  if (!signature) {
    return false
  }
  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex")

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Verifies the client-side checkout signature returned by the Razorpay modal:
 * HMAC-SHA256 of `${order_id}|${payment_id}` keyed by the key secret.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string | undefined,
  keySecret: string
): boolean {
  if (!signature) {
    return false
  }
  const expected = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
