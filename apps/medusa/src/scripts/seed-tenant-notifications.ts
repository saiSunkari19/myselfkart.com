import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readTenantId(): string {
  const tenantId = process.env.SELLER_ADMIN_TENANT_ID ?? process.env.TENANT_ID ?? ""

  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("SELLER_ADMIN_TENANT_ID or TENANT_ID must be a valid UUID")
  }

  return tenantId
}

function tenantSuffix(tenantId: string): string {
  return tenantId.endsWith("00000000000a") ? "a" : "b"
}

export default async function seedTenantNotifications({ container }: ExecArgs) {
  const tenantId = readTenantId()
  const suffix = tenantSuffix(tenantId)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  await runWithTenantContext({ tenantId, source: "test" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      await trx("notification")
        .insert({
          id: `noti_selfkart_rls_${suffix}`,
          to: `tenant-${suffix}@selfkart.test`,
          channel: "feed",
          template: "selfkart-rls-notification",
          data: JSON.stringify({
            title: `Tenant ${suffix.toUpperCase()} notification`,
            description: "Tenant notification RLS fixture",
          }),
          trigger_type: "selfkart-rls-test",
          resource_id: `order_selfkart_rls_${suffix}`,
          resource_type: "order",
          receiver_id: `tenant-${suffix}`,
          idempotency_key: `selfkart-rls-notification-${suffix}`,
          status: "success",
        })
        .onConflict("id")
        .merge({
          to: `tenant-${suffix}@selfkart.test`,
          data: JSON.stringify({
            title: `Tenant ${suffix.toUpperCase()} notification`,
            description: "Tenant notification RLS fixture",
          }),
          updated_at: trx.fn.now(),
        })
    })
  })

  logger.info(`Seeded tenant notification fixture for tenant_id=${tenantId}`)
}
