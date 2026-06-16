import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

type NotificationSummary = {
  tenant_a_notifications: number
  tenant_b_notifications: number
  all_fixture_notifications: number
}

async function summaryFor(knex: Knex, tenantId: string): Promise<NotificationSummary> {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])

      const result = await trx.raw(`
        select
          (select count(*)::int from notification where id = 'noti_selfkart_rls_a') as tenant_a_notifications,
          (select count(*)::int from notification where id = 'noti_selfkart_rls_b') as tenant_b_notifications,
          (select count(*)::int from notification where id like 'noti_selfkart_rls_%') as all_fixture_notifications
      `)

      return result.rows[0]
    })
  })
}

export default async function assertNotificationIsolation({ container }: ExecArgs) {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const tenantA = await summaryFor(knex, TENANT_A)
  const tenantB = await summaryFor(knex, TENANT_B)
  const noContext = await knex.raw(`
    select count(*)::int as count
    from notification
    where id like 'noti_selfkart_rls_%'
  `)

  assert.equal(tenantA.tenant_a_notifications, 1, "tenant A must see its notification")
  assert.equal(tenantA.tenant_b_notifications, 0, "tenant A must not see tenant B notification")
  assert.equal(tenantA.all_fixture_notifications, 1, "tenant A must see only one fixture notification")

  assert.equal(tenantB.tenant_a_notifications, 0, "tenant B must not see tenant A notification")
  assert.equal(tenantB.tenant_b_notifications, 1, "tenant B must see its notification")
  assert.equal(tenantB.all_fixture_notifications, 1, "tenant B must see only one fixture notification")

  assert.equal(
    noContext.rows[0].count,
    0,
    "no tenant context must not see tenant notification fixtures"
  )

  logger.info("NOTIFICATION PASS: notification rows are tenant-isolated")
}
