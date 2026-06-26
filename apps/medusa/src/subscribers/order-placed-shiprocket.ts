import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"
import { isShiprocketEnabled, resolveShiprocketCredentials } from "../lib/shiprocket/credentials"
import { getShiprocketToken } from "../lib/shiprocket/token"
import { ShiprocketClient } from "../lib/shiprocket/client"

/**
 * SH-3: push a placed order into the seller's Shiprocket account so the seller can
 * fulfill it there and Shiprocket's status webhook flows back to
 * /webhooks/delivery/<tenant_id> (which emails the buyer). We pass the Medusa
 * order.id as Shiprocket's `order_id`, so the webhook echoes it as
 * `channel_order_id` and reconciliation is exact.
 *
 * Tenant resolved from the non-RLS order_tenant_map (subscribers run out of
 * context); only runs for tenants with Shiprocket enabled. Idempotent via
 * order_shiprocket. Errors are logged, never thrown.
 */
const COUNTRY_NAME: Record<string, string> = {
  in: "India",
  us: "United States",
  ae: "United Arab Emirates",
}

function digits(v: unknown): string {
  return String(v ?? "").replace(/[^0-9]/g, "")
}

export default async function orderPlacedShiprocketHandler({
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
  if (!tenantId) return

  if (!(await isShiprocketEnabled(knex, tenantId))) return

  // Idempotency: skip if we already pushed this order.
  const already = await knex("order_shiprocket").where({ order_id: orderId }).first("order_id")
  if (already) return

  try {
    const creds = await resolveShiprocketCredentials(knex, tenantId)
    const token = await getShiprocketToken(tenantId, creds.apiEmail, creds.apiPassword)
    const client = new ShiprocketClient(token)

    // Pickup location: configured, else the account's primary/first.
    let pickup = creds.pickupLocation
    if (!pickup) {
      const locations = await client.getPickupLocations()
      pickup = (locations.find((l) => l.is_primary_location) ?? locations[0])?.pickup_location ?? null
    }
    if (!pickup) {
      logger.error(`[shiprocket-push] no pickup location for tenant ${tenantId}; skipping order ${orderId}`)
      return
    }

    await runWithTenantContext({ tenantId, source: "session" }, async () => {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "email",
          "currency_code",
          "total",
          "items.title",
          "items.variant_sku",
          "items.quantity",
          "items.unit_price",
          "shipping_address.first_name",
          "shipping_address.last_name",
          "shipping_address.company",
          "shipping_address.address_1",
          "shipping_address.address_2",
          "shipping_address.city",
          "shipping_address.province",
          "shipping_address.postal_code",
          "shipping_address.country_code",
          "shipping_address.phone",
        ],
        filters: { id: orderId },
      })
      const order = data?.[0]
      const addr = order?.shipping_address
      if (!order || !addr?.address_1) {
        logger.warn(`[shiprocket-push] order ${orderId} missing shipping address; skipping`)
        return
      }

      const country = COUNTRY_NAME[String(addr.country_code ?? "").toLowerCase()] ?? "India"
      const now = new Date().toISOString().replace("T", " ").slice(0, 16)
      // Shiprocket requires a non-empty sku per line item ("order_items.0.sku
      // field is required when is document is 0"). Use the variant SKU; fall
      // back to the line id so the push never fails on a product saved without
      // a SKU.
      const items = (order.items ?? []).map((it: any) => ({
        name: String(it?.title ?? "Item"),
        sku: String(it?.variant_sku || it?.id || it?.title || "SKU"),
        units: Number(it?.quantity ?? 1),
        selling_price: Number(it?.unit_price ?? 0),
      }))

      const payload: Record<string, unknown> = {
        order_id: order.id, // Medusa id → echoed back as channel_order_id
        order_date: now,
        pickup_location: pickup,
        billing_customer_name: addr.first_name ?? "Customer",
        billing_last_name: addr.last_name ?? "",
        // Combine line 1 + the locality/landmark line so Shiprocket's address
        // line carries the full street (a bare house number trips its "junk
        // address" RTO heuristic).
        billing_address: [addr.address_1, addr.address_2].filter(Boolean).join(", "),
        // Shiprocket has no landmark field; the buyer's landmark is carried in the
        // address `company` field — send it as the second address line.
        billing_address_2: addr.company ?? "",
        billing_city: addr.city ?? "",
        billing_pincode: addr.postal_code ?? "",
        billing_state: addr.province ?? "",
        billing_country: country,
        billing_email: order.email,
        // Last 10 digits → drops a leading 0 or a 91/+91 country code so Shiprocket
        // gets a clean 10-digit Indian mobile (it rejects/flags otherwise).
        billing_phone: digits(addr.phone).slice(-10),
        shipping_is_billing: true,
        order_items: items,
        payment_method: "Prepaid",
        sub_total: Number(order.total ?? 0),
        // Sensible defaults; sellers can adjust the shipment in Shiprocket.
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      }

      const result = await client.createAdhocOrder(payload)
      await knex("order_shiprocket")
        .insert({
          order_id: order.id,
          tenant_id: tenantId,
          shiprocket_order_id: result?.order_id != null ? String(result.order_id) : null,
          shipment_id: result?.shipment_id != null ? String(result.shipment_id) : null,
          status: result?.status ?? null,
        })
        .onConflict("order_id")
        .ignore()

      logger.info(
        `[shiprocket-push] pushed order ${order.id} (display #${order.display_id}) to Shiprocket for tenant ${tenantId} (shipment_id=${result?.shipment_id})`
      )
    })
  } catch (e) {
    logger.error(
      `[shiprocket-push] failed to push order ${orderId} (tenant=${tenantId}): ${
        (e as Error)?.message ?? e
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
