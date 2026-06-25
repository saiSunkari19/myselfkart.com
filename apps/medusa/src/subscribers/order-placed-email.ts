import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"
import { getStoreConfig } from "../platform/repository"
import { renderStoreEmail, type EmailItem } from "../lib/email-template"
import { sendStoreEmail } from "../lib/store-email"

/**
 * Sends the buyer their order-confirmation email under the store's identity (C-1).
 *
 * `order.placed` fires from a background subscriber that runs OUT of tenant
 * context, and the `order` table is RLS-forced — so we can't read the order
 * directly. We resolve the tenant from the non-RLS `order_tenant_map` bridge
 * (populated by an AFTER INSERT trigger on `order`), then re-enter
 * `runWithTenantContext` so the RLS read patch lets us load the order. The same
 * bridge will serve the Shiprocket webhook (SH-4).
 *
 * Fail-closed: no tenant mapping → skip (never send under a blank/wrong identity).
 * Errors are logged, never thrown.
 */
function money(amount: unknown, currency: string): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return ""
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency.toUpperCase() }).format(n)
  } catch {
    return `${n} ${currency.toUpperCase()}`
  }
}

export default async function orderPlacedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = event.data?.id
  if (!orderId) return

  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const mapping = await knex("order_tenant_map")
    .where({ order_id: orderId })
    .first<{ tenant_id: string } | undefined>("tenant_id")
  const tenantId = mapping?.tenant_id
  if (!tenantId) {
    logger.warn(`[order-email] no tenant mapping for order ${orderId}; skipping confirmation`)
    return
  }

  try {
    await runWithTenantContext({ tenantId, source: "session" }, async () => {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      // Order/line-item totals are computed on-demand, not stored columns. They
      // only resolve when `total` is requested explicitly (a bare `*` would
      // override it) AND the items/summary relations are expanded with `*` so
      // the calculation has its inputs. Narrowing to `items.total` returns 0 —
      // hence the ₹0.00 / qty-1 email this replaces.
      const { data } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "email",
          "currency_code",
          "total",
          "items.*",
          "summary.*",
        ],
        filters: { id: orderId },
      })
      const order = data?.[0]
      if (!order?.email) {
        logger.warn(`[order-email] order ${orderId} not visible / no email (tenant=${tenantId}); skipping`)
        return
      }

      const currency = String(order.currency_code ?? "inr")
      const items: EmailItem[] = (order.items ?? []).map((it: any) => ({
        name: String(it?.title ?? "Item"),
        quantity: Number(it?.quantity ?? 1),
        price: money(it?.total, currency),
      }))

      const config = await getStoreConfig(knex, tenantId)
      const domainRow = await knex("tenant_domains")
        .where({ tenant_id: tenantId, is_primary: true })
        .first<{ host: string | null } | undefined>("host")
      const host = domainRow?.host ?? undefined
      const orderUrl = host
        ? `${host.includes("localhost") ? "http" : "https"}://${host}/order/${orderId}`
        : undefined

      const storeName = config?.store_name?.trim() || "Store"
      const { html, text } = renderStoreEmail({
        storeName,
        logoUrl: config?.logo_url,
        primaryColor: config?.primary_color,
        preheader: `Your ${storeName} order #${order.display_id} is confirmed`,
        heading: `Order #${order.display_id} confirmed`,
        intro: `Thank you for your order with ${storeName}. We've received it and will let you know when it ships.`,
        itemsTitle: "Order summary",
        items,
        rows: [{ label: "Total", value: money(order.total, currency) }],
        button: orderUrl ? { label: "View your order", url: orderUrl } : undefined,
        supportEmail: config?.contact_email,
        footerNote: `This order confirmation was sent by ${storeName} via Selfkart.`,
      })

      await sendStoreEmail(container, {
        tenantId,
        to: order.email,
        subject: `Order #${order.display_id} confirmed`,
        html,
        text,
        template: "order-confirmation",
        idempotencyKey: `order-confirmation:${orderId}`,
        data: { order_id: orderId, order_url: orderUrl },
      })
    })
  } catch (e) {
    logger.error(
      `[order-email] failed to send confirmation for order ${orderId} (tenant=${tenantId}): ${
        (e as Error)?.message ?? e
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
