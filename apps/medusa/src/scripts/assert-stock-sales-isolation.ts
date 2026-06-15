import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

type StockSalesSummary = {
  stock_locations: number
  sales_channels: number
  channel_location_links: number
  tenant_a_sales_channels: number
  tenant_b_sales_channels: number
}

async function summaryFor(knex: Knex, tenantId: string): Promise<StockSalesSummary> {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])

      const result = await trx.raw(`
        select
          (select count(*)::int from stock_location) as stock_locations,
          (select count(*)::int from sales_channel) as sales_channels,
          (select count(*)::int from sales_channel_stock_location) as channel_location_links,
          (select count(*)::int from sales_channel where name = 'Tenant A Sales Channel') as tenant_a_sales_channels,
          (select count(*)::int from sales_channel where name = 'Tenant B Sales Channel') as tenant_b_sales_channels
      `)

      return result.rows[0]
    })
  })
}

export default async function assertStockSalesIsolation({ container }: ExecArgs) {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const tenantA = await summaryFor(knex, TENANT_A)
  const tenantB = await summaryFor(knex, TENANT_B)
  const noContext = await knex.raw(`
    select
      (select count(*)::int from stock_location) as stock_locations,
      (select count(*)::int from sales_channel where tenant_id is not null) as tenant_sales_channels,
      (select count(*)::int from sales_channel_stock_location) as channel_location_links
  `)

  assert.equal(
    noContext.rows[0].stock_locations,
    0,
    "no context must see zero stock locations"
  )
  assert.equal(
    noContext.rows[0].tenant_sales_channels,
    0,
    "no context must see zero tenant-owned sales channels"
  )
  assert.equal(
    noContext.rows[0].channel_location_links,
    0,
    "no context must see zero sales-channel stock-location links"
  )

  assert.ok(tenantA.stock_locations >= 1, "tenant A must see its stock location")
  assert.ok(tenantB.stock_locations >= 1, "tenant B must see its stock location")
  assert.ok(tenantA.sales_channels >= 1, "tenant A must see its sales channel")
  assert.ok(tenantB.sales_channels >= 1, "tenant B must see its sales channel")
  assert.ok(
    tenantA.channel_location_links >= 1,
    "tenant A must see its sales-channel stock-location link"
  )
  assert.ok(
    tenantB.channel_location_links >= 1,
    "tenant B must see its sales-channel stock-location link"
  )
  assert.equal(
    tenantA.tenant_a_sales_channels,
    1,
    "tenant A must see the Tenant A sales channel"
  )
  assert.equal(
    tenantA.tenant_b_sales_channels,
    0,
    "tenant A must not see the Tenant B sales channel"
  )
  assert.equal(
    tenantB.tenant_a_sales_channels,
    0,
    "tenant B must not see the Tenant A sales channel"
  )
  assert.equal(
    tenantB.tenant_b_sales_channels,
    1,
    "tenant B must see the Tenant B sales channel"
  )

  logger.info("STOCK/SALES PASS: stock locations and sales channels are tenant-isolated")
}
