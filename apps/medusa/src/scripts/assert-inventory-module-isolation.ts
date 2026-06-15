import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

type InventorySummary = {
  inventory_items: number
  fixture_a_items: number
  fixture_b_items: number
  positive_inventory_levels: number
}

async function inventorySummaryFor(
  knex: Knex,
  tenantId: string
): Promise<InventorySummary> {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])

      const result = await trx.raw(`
        select
          (select count(*)::int from inventory_item) as inventory_items,
          (select count(*)::int from inventory_item where sku like 'selfkart-rls-a-%') as fixture_a_items,
          (select count(*)::int from inventory_item where sku like 'selfkart-rls-b-%') as fixture_b_items,
          (select count(*)::int from inventory_level where stocked_quantity > 0) as positive_inventory_levels
      `)

      return result.rows[0]
    })
  })
}

export default async function assertInventoryModuleIsolation({ container }: ExecArgs) {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const tenantA = await inventorySummaryFor(knex, TENANT_A)
  const tenantB = await inventorySummaryFor(knex, TENANT_B)
  const noContext = await knex.raw(`
    select
      (select count(*)::int from inventory_item) as inventory_items,
      (select count(*)::int from inventory_level) as inventory_levels
  `)

  assert.equal(
    noContext.rows[0].inventory_items,
    0,
    "no tenant context must see zero inventory items"
  )
  assert.equal(
    noContext.rows[0].inventory_levels,
    0,
    "no tenant context must see zero inventory levels"
  )

  assert.equal(tenantA.fixture_a_items, 2, "tenant A must see its fixture inventory")
  assert.equal(tenantA.fixture_b_items, 0, "tenant A must not see tenant B inventory")
  assert.equal(tenantB.fixture_a_items, 0, "tenant B must not see tenant A inventory")
  assert.equal(tenantB.fixture_b_items, 2, "tenant B must see its fixture inventory")
  assert.ok(tenantA.inventory_items >= 2, "tenant A must see tenant-scoped inventory")
  assert.ok(tenantB.inventory_items >= 2, "tenant B must see tenant-scoped inventory")
  assert.ok(tenantA.positive_inventory_levels >= 2, "tenant A must have stocked levels")
  assert.ok(tenantB.positive_inventory_levels >= 2, "tenant B must have stocked levels")

  logger.info("INVENTORY MODULE PASS: inventory_item and inventory_level RLS is tenant-isolated")
}
