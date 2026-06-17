import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

import {
  requireTenantId,
  resolveRazorpayCredentials,
} from "./credentials"
import { RazorpayClient, toSmallestUnit } from "./razorpay-client"

type InjectedDependencies = {
  logger?: Logger
}

/**
 * Multi-tenant Razorpay payment provider.
 *
 * Unlike a typical Medusa payment provider, this one holds NO keys of its own:
 * each operation resolves the *current tenant's* encrypted Razorpay credentials
 * from `tenant_payment_credentials` (via AsyncLocalStorage tenant context) and
 * builds a per-request client. One registered provider therefore serves every
 * seller, each charging into their own Razorpay account.
 *
 * Registered id: `pp_razorpay_razorpay` (identifier "razorpay" + config id
 * "razorpay").
 */
class RazorpayProviderService extends AbstractPaymentProvider {
  static identifier = "razorpay"

  protected logger_?: Logger

  constructor(container: InjectedDependencies, config: Record<string, unknown>) {
    super(container as Record<string, unknown>, config)
    this.logger_ = container?.logger
  }

  /** Builds a Razorpay client bound to the current tenant's credentials. */
  private async clientForCurrentTenant(): Promise<{
    client: RazorpayClient
    tenantId: string
    keyId: string
    mode: "test" | "live"
  }> {
    const tenantId = requireTenantId()
    const creds = await resolveRazorpayCredentials(tenantId)
    return {
      client: new RazorpayClient(creds.keyId, creds.keySecret),
      tenantId,
      keyId: creds.keyId,
      mode: creds.mode,
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { client, tenantId, keyId, mode } =
      await this.clientForCurrentTenant()

    const currency = input.currency_code.toUpperCase()
    const amount = toSmallestUnit(toNumber(input.amount))

    const order = await client.createOrder({
      amount,
      currency,
      notes: { tenant_id: tenantId },
    })

    // `data` is persisted on the PaymentSession and is publicly readable by the
    // storefront — it holds only the order id and the PUBLIC key id (never the
    // secret), exactly what the Razorpay checkout widget needs.
    return {
      id: order.id,
      status: "pending",
      data: {
        razorpay_order_id: order.id,
        key_id: keyId,
        mode,
        amount,
        currency,
      },
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const orderId = (input.data?.razorpay_order_id as string) || ""
    if (!orderId) {
      return { status: "error", data: input.data ?? {} }
    }

    const { client } = await this.clientForCurrentTenant()
    // Source of truth is Razorpay, not a value passed from the browser: only
    // authorize if Razorpay itself reports a captured/authorized payment.
    const payments = await client.getOrderPayments(orderId)
    const paid = payments.find(
      (p) => p.status === "captured" || p.status === "authorized"
    )

    if (!paid) {
      // No successful payment yet → keep the session open; cart completion
      // fails closed rather than creating an unpaid order.
      return { status: "pending", data: input.data ?? {} }
    }

    return {
      status: paid.status === "captured" ? "captured" : "authorized",
      data: {
        ...input.data,
        razorpay_payment_id: paid.id,
        razorpay_status: paid.status,
      },
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const paymentId = (input.data?.razorpay_payment_id as string) || ""
    const amount = Number(input.data?.amount ?? 0)
    const currency = (input.data?.currency as string) || ""
    if (!paymentId) {
      return { data: input.data ?? {} }
    }

    const { client } = await this.clientForCurrentTenant()
    const payment = await client.getPayment(paymentId)

    // Orders are created with auto-capture, so the payment is usually already
    // captured by the time we get here — only capture if it isn't.
    if (payment.status === "authorized") {
      const captured = await client.capturePayment(paymentId, amount, currency)
      return { data: { ...input.data, razorpay_status: captured.status } }
    }

    return { data: { ...input.data, razorpay_status: payment.status } }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const paymentId = (input.data?.razorpay_payment_id as string) || ""
    if (!paymentId) {
      throw new Error("Cannot refund: missing Razorpay payment id")
    }

    const { client } = await this.clientForCurrentTenant()
    const refund = await client.refundPayment(
      paymentId,
      toSmallestUnit(toNumber(input.amount))
    )
    return {
      data: {
        ...input.data,
        razorpay_refund_id: refund.id,
        razorpay_status: "refunded",
      },
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    // Nothing to cancel server-side for an uncaptured Razorpay order; a captured
    // payment is reversed via refundPayment instead.
    return { data: input.data ?? {} }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    // Razorpay has no "delete order" — switching payment method just abandons it.
    return { data: input.data ?? {} }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const orderId = (input.data?.razorpay_order_id as string) || ""
    if (!orderId) {
      return { status: "pending", data: input.data ?? {} }
    }

    const { client } = await this.clientForCurrentTenant()
    const payments = await client.getOrderPayments(orderId)
    const paid = payments.find(
      (p) => p.status === "captured" || p.status === "authorized"
    )

    return {
      status: paid ? razorpayToSessionStatus(paid.status) : "pending",
      data: input.data ?? {},
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const paymentId = (input.data?.razorpay_payment_id as string) || ""
    const orderId = (input.data?.razorpay_order_id as string) || ""
    const { client } = await this.clientForCurrentTenant()

    if (paymentId) {
      const payment = await client.getPayment(paymentId)
      return { data: { ...input.data, razorpay_status: payment.status } }
    }
    if (orderId) {
      const order = await client.getOrder(orderId)
      return { data: { ...input.data, razorpay_status: order.status } }
    }
    return { data: input.data ?? {} }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    const currentAmount = Number(input.data?.amount ?? 0)
    const nextAmount = toSmallestUnit(toNumber(input.amount))

    // If the cart total is unchanged, keep the existing Razorpay order.
    if (currentAmount === nextAmount) {
      return { status: "pending", data: input.data ?? {} }
    }

    // Amount changed (e.g. shipping added after the session was created): a
    // Razorpay order's amount is immutable, so create a fresh order.
    const { client, tenantId, keyId, mode } =
      await this.clientForCurrentTenant()
    const currency = input.currency_code.toUpperCase()
    const order = await client.createOrder({
      amount: nextAmount,
      currency,
      notes: { tenant_id: tenantId },
    })

    return {
      status: "pending",
      data: {
        razorpay_order_id: order.id,
        key_id: keyId,
        mode,
        amount: nextAmount,
        currency,
      },
    }
  }

  /**
   * Webhook handling is intentionally conservative. The synchronous
   * authorize-at-cart-completion flow already creates the order on the buyer's
   * request, so we don't need the webhook to drive capture — and Medusa's
   * payment session id isn't known when the Razorpay order is created, so we
   * can't safely map a webhook event back to a session here. We therefore
   * acknowledge the event without taking an action. (Async recovery for buyers
   * who pay but never return to the storefront is a follow-up.)
   */
  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return {
      action: "not_supported",
      data: { session_id: "", amount: new BigNumber(0) },
    }
  }
}

function razorpayToSessionStatus(status: string): PaymentSessionStatus {
  switch (status) {
    case "captured":
      return "captured"
    case "authorized":
      return "authorized"
    case "failed":
      return "error"
    default:
      return "pending"
  }
}

/** Coerces Medusa's BigNumberInput (number | string | BigNumber) to a number. */
function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    return Number(value)
  }
  const n = Number((value as { valueOf?: () => unknown })?.valueOf?.() ?? value)
  return Number.isFinite(n) ? n : 0
}

export default RazorpayProviderService
