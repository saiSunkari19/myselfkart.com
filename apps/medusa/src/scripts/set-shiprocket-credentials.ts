import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { upsertTenantShiprocketCredentials } from "../platform/repository"

/**
 * Operator CLI to configure a tenant's Shiprocket integration (SH-1) until the
 * superadmin UI lands. Reads env vars:
 *   SHIPROCKET_TENANT_ID            (required)
 *   SHIPROCKET_API_EMAIL            (required)
 *   SHIPROCKET_API_PASSWORD         (required on first setup; omit to keep existing)
 *   SHIPROCKET_PICKUP_LOCATION      (optional; else the account's primary is used)
 *   SHIPROCKET_TENANT_WEBHOOK_SECRET(optional; per-tenant x-api-key; else env fallback)
 *   SHIPROCKET_ENABLED              (optional; "false" to disable; default enabled)
 *
 * Run: SHIPROCKET_TENANT_ID=… SHIPROCKET_API_EMAIL=… SHIPROCKET_API_PASSWORD=… \
 *        corepack pnpm run set:shiprocket
 */
export default async function setShiprocketCredentials({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const tenantId = process.env.SHIPROCKET_TENANT_ID ?? ""
  const apiEmail = process.env.SHIPROCKET_API_EMAIL ?? ""
  const apiPassword = process.env.SHIPROCKET_API_PASSWORD || undefined
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || undefined
  const webhookSecret = process.env.SHIPROCKET_TENANT_WEBHOOK_SECRET || undefined
  const enabled = (process.env.SHIPROCKET_ENABLED ?? "true").toLowerCase() !== "false"

  if (!tenantId || !apiEmail) {
    throw new Error(
      "Set SHIPROCKET_TENANT_ID and SHIPROCKET_API_EMAIL (and SHIPROCKET_API_PASSWORD on first setup)"
    )
  }

  const summary = await upsertTenantShiprocketCredentials(knex, tenantId, {
    enabled,
    apiEmail,
    apiPassword,
    webhookSecret,
    pickupLocation,
  })

  logger.info(
    `Shiprocket saved for tenant ${tenantId}: enabled=${summary.enabled} ready=${summary.ready} ` +
      `pickup=${summary.pickup_location ?? "(account primary)"} pw=…${summary.api_password_hint}` +
      (summary.webhook_secret_hint ? ` webhook=…${summary.webhook_secret_hint}` : " webhook=(env fallback)")
  )
}
