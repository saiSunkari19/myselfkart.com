import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

const A_PRICE_SET = "ps_selfkart_rls_a"
const B_PRICE_SET = "ps_selfkart_rls_b"

// Tenant-scoped checkout tables that must be locked down (RLS enabled + forced
// + an isolation policy). Mirrors 20260616000300-protect-checkout-tables.ts.
const PROTECTED_TABLES = [
  "price_set",
  "price",
  "payment_collection",
  "payment",
  "payment_session",
  "fulfillment_set",
  "service_zone",
  "shipping_option",
  "fulfillment",
  "fulfillment_address",
  "price_rule",
  "geo_zone",
  "shipping_option_rule",
  "capture",
  "refund",
  "fulfillment_item",
  "fulfillment_label",
  "shipping_option_price_set",
  "location_fulfillment_set",
  "location_fulfillment_provider",
]

async function seedPriceSet(knex: Knex, tenantId: string, id: string): Promise<void> {
  // The nullable-direct stamping trigger sets tenant_id from app.current_tenant,
  // so this row becomes tenant-owned without us passing tenant_id explicitly.
  await runWithTenantContext({ tenantId, source: "test" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      await trx("price_set").insert({ id }).onConflict("id").merge({ updated_at: trx.fn.now() })
    })
  })
}

async function visiblePriceSets(
  knex: Knex,
  tenantId: string,
  ids: string[]
): Promise<string[]> {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      const rows = await trx("price_set").whereIn("id", ids).select("id")
      return rows.map((r: { id: string }) => r.id)
    })
  })
}

export default async function assertCheckoutIsolation({ container }: ExecArgs) {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // --- Structural: every checkout table is RLS-enabled, forced, and has a policy ---
  const rls = await knex.raw(
    `
      select c.relname, c.relrowsecurity, c.relforcerowsecurity,
        (select count(*)::int from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relname = any(?)
    `,
    [PROTECTED_TABLES]
  )
  const byName = new Map<string, any>(rls.rows.map((r: any) => [r.relname, r]))
  for (const table of PROTECTED_TABLES) {
    const row = byName.get(table)
    assert.ok(row, `${table} must exist`)
    assert.equal(row.relrowsecurity, true, `${table} must have RLS enabled`)
    assert.equal(row.relforcerowsecurity, true, `${table} must have RLS forced`)
    assert.ok(row.policy_count >= 1, `${table} must have at least one RLS policy`)
  }

  // --- Row-level: a tenant-owned price_set is visible only to its tenant ---
  await seedPriceSet(knex, TENANT_A, A_PRICE_SET)
  await seedPriceSet(knex, TENANT_B, B_PRICE_SET)

  const ids = [A_PRICE_SET, B_PRICE_SET]
  const seenByA = await visiblePriceSets(knex, TENANT_A, ids)
  const seenByB = await visiblePriceSets(knex, TENANT_B, ids)
  const noContext = await knex("price_set").whereIn("id", ids).select("id")

  assert.deepEqual(seenByA, [A_PRICE_SET], "tenant A must see only its own price_set")
  assert.deepEqual(seenByB, [B_PRICE_SET], "tenant B must see only its own price_set")
  assert.equal(
    noContext.length,
    0,
    "no tenant context must see zero tenant-owned price_sets"
  )

  logger.info(
    "CHECKOUT PASS: pricing/fulfillment/payment tables are RLS-forced and tenant-isolated"
  )
}
