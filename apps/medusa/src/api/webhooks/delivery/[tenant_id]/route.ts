import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../../../../modules/tenant-context"
import { getStoreConfig } from "../../../../platform/repository"
import { renderStoreEmail } from "../../../../lib/email-template"
import { sendStoreEmail } from "../../../../lib/store-email"

/**
 * Shiprocket shipment-status webhook (SH-6). Public POST (no auth middleware over
 * /webhooks/*), per Shiprocket's "endpoint must be open access" requirement. The
 * URL deliberately avoids the banned keywords (shiprocket/sr/kr).
 *
 * Security: Shiprocket sends our secret in the `x-api-key` header (Auth Token Type
 * = x-api-key). We verify it against SHIPROCKET_WEBHOOK_SECRET. The tenant is taken
 * from the URL path; we then re-enter `runWithTenantContext` and look up the order
 * by `channel_order_id` (the Medusa order id we pass to Shiprocket at order
 * creation) — RLS guarantees we can only resolve THIS tenant's order, so a stray
 * id from another tenant simply won't be found.
 *
 * Always responds 200 (after auth) so Shiprocket's "Test Webhook" + retries don't
 * storm: unknown order / ignored status / test payload all 200 with a log line.
 *
 * Follow-ups: per-tenant secret (SH-1) instead of one shared env secret; a
 * forward-only status ledger (SH-5) — today we dedupe per (order,status) via the
 * notification idempotency key.
 */

// Shiprocket status (lowercased) -> our email intent. Anything else is ignored.
const STATUS_EMAIL: Record<string, { kind: string; heading: string; intro: string }> = {
  shipped: {
    kind: "shipped",
    heading: "Your order has shipped",
    intro: "Good news — your order is on its way.",
  },
  "picked up": {
    kind: "shipped",
    heading: "Your order has shipped",
    intro: "Good news — your order has been picked up and is on its way.",
  },
  "out for delivery": {
    kind: "out_for_delivery",
    heading: "Out for delivery",
    intro: "Your order is out for delivery and should arrive today.",
  },
  delivered: {
    kind: "delivered",
    heading: "Your order was delivered",
    intro: "Your order has been delivered. We hope you love it!",
  },
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const tenantId = req.params.tenant_id

  // --- auth: x-api-key must match the configured secret ---
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET
  if (!secret) {
    logger.error("[ship-webhook] SHIPROCKET_WEBHOOK_SECRET is not set; rejecting")
    res.status(503).json({ ok: false })
    return
  }
  const provided = req.headers["x-api-key"]
  if (provided !== secret) {
    logger.warn(`[ship-webhook] bad/absent x-api-key for tenant ${tenantId}`)
    res.status(401).json({ ok: false })
    return
  }

  const body = (req.body ?? {}) as Record<string, any>
  const status = String(body.shipment_status ?? body.current_status ?? "").toLowerCase().trim()
  const statusId = body.shipment_status_id ?? body.current_status_id ?? "x"
  const channelOrderId = String(body.channel_order_id ?? "").trim()
  const awb = body.awb != null ? String(body.awb) : undefined
  const courier = body.courier_name ? String(body.courier_name) : undefined

  // Respond 200 regardless of what we do below — never make Shiprocket retry.
  const done = () => {
    if (!res.headersSent) res.status(200).json({ ok: true })
  }

  const mapping = STATUS_EMAIL[status]
  if (!mapping) {
    logger.info(`[ship-webhook] tenant=${tenantId} status="${status}" not emailable; ack`)
    return done()
  }
  if (!channelOrderId || channelOrderId.startsWith("enter your")) {
    logger.info(`[ship-webhook] tenant=${tenantId} no real channel_order_id (test payload?); ack`)
    return done()
  }

  try {
    await runWithTenantContext({ tenantId, source: "session" }, async () => {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const filters = channelOrderId.startsWith("order_")
        ? { id: channelOrderId }
        : { display_id: Number(channelOrderId) }
      const { data } = await query.graph({
        entity: "order",
        fields: ["id", "display_id", "email"],
        filters,
      })
      const order = data?.[0]
      if (!order?.email) {
        logger.warn(
          `[ship-webhook] order ${channelOrderId} not visible for tenant ${tenantId}; ack`
        )
        return
      }

      const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
      const config = await getStoreConfig(knex, tenantId)
      const domainRow = await knex("tenant_domains")
        .where({ tenant_id: tenantId, is_primary: true })
        .first<{ host: string | null } | undefined>("host")
      const host = domainRow?.host ?? undefined
      const orderUrl = host
        ? `${host.includes("localhost") ? "http" : "https"}://${host}/order/${order.id}`
        : undefined

      const storeName = config?.store_name?.trim() || "Store"
      const rows = [
        ...(awb ? [{ label: "Tracking (AWB)", value: awb }] : []),
        ...(courier ? [{ label: "Courier", value: courier }] : []),
      ]
      const { html, text } = renderStoreEmail({
        storeName,
        logoUrl: config?.logo_url,
        primaryColor: config?.primary_color,
        preheader: `${mapping.heading} — order #${order.display_id}`,
        heading: `${mapping.heading} · Order #${order.display_id}`,
        intro: `${mapping.intro}`,
        rows: rows.length ? rows : undefined,
        button: orderUrl ? { label: "Track your order", url: orderUrl } : undefined,
        supportEmail: config?.contact_email,
        footerNote: `Shipping update sent by ${storeName} via Selfkart.`,
      })

      await sendStoreEmail(req.scope, {
        tenantId,
        to: order.email,
        subject: `${mapping.heading} · Order #${order.display_id}`,
        html,
        text,
        template: `shipping-${mapping.kind}`,
        idempotencyKey: `ship:${order.id}:${statusId}`,
        data: { order_id: order.id, awb, status: mapping.kind },
      })
      logger.info(
        `[ship-webhook] sent "${mapping.kind}" for order ${order.id} (tenant=${tenantId})`
      )
    })
  } catch (e) {
    logger.error(
      `[ship-webhook] error for tenant ${tenantId}, order ${channelOrderId}: ${
        (e as Error)?.message ?? e
      }`
    )
  }
  return done()
}
