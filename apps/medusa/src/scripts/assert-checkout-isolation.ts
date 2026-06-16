import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
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

async function tenantVariantPriceVisibility(
  knex: Knex,
  tenantId: string
): Promise<{ missingPriceSetCount: number; missingPriceCount: number }> {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      const rows = await trx.raw(
        `
          select
            count(*) filter (where ps.id is null)::int as missing_price_set_count,
            count(*) filter (where pr.id is null)::int as missing_price_count
          from product_variant pv
          join product p on p.id = pv.product_id
          join product_variant_price_set pvps on pvps.variant_id = pv.id
          left join price_set ps on ps.id = pvps.price_set_id
          left join price pr on pr.price_set_id = ps.id
            and pr.currency_code = 'usd'
            and pr.deleted_at is null
          where p.deleted_at is null
          and pv.deleted_at is null
        `
      )
      return {
        missingPriceSetCount: Number(rows.rows[0]?.missing_price_set_count ?? 0),
        missingPriceCount: Number(rows.rows[0]?.missing_price_count ?? 0),
      }
    })
  })
}

type InventoryModule = {
  confirmInventory: (
    inventoryItemId: string,
    locationIds: string[],
    quantity: number
  ) => Promise<boolean>
}

async function tenantInventoryProbe(
  knex: Knex,
  tenantId: string
): Promise<{ inventoryItemId: string; locationId: string } | null> {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      const row = await trx("product as p")
        .join("product_variant as pv", "pv.product_id", "p.id")
        .join("product_variant_inventory_item as pvii", "pvii.variant_id", "pv.id")
        .join("inventory_level as il", "il.inventory_item_id", "pvii.inventory_item_id")
        .where("p.tenant_id", tenantId)
        .whereNull("p.deleted_at")
        .whereNull("pv.deleted_at")
        .whereNull("pvii.deleted_at")
        .whereNull("il.deleted_at")
        .where("il.stocked_quantity", ">", 0)
        .first<{ inventory_item_id: string; location_id: string }>(
          "pvii.inventory_item_id",
          "il.location_id"
        )

      return row
        ? { inventoryItemId: row.inventory_item_id, locationId: row.location_id }
        : null
    })
  })
}

async function assertTenantInventoryConfirmation(
  knex: Knex,
  inventory: InventoryModule,
  tenantId: string
): Promise<void> {
  const probe = await tenantInventoryProbe(knex, tenantId)
  assert.ok(probe, `${tenantId} must have a stocked inventory item`)

  const confirmed = await runWithTenantContext({ tenantId, source: "test" }, () =>
    inventory.confirmInventory(probe.inventoryItemId, [probe.locationId], 1)
  )
  assert.equal(
    confirmed,
    true,
    `${tenantId} inventory module must confirm its own stocked item`
  )
}

export default async function assertCheckoutIsolation({ container }: ExecArgs) {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const inventory = container.resolve<InventoryModule>(Modules.INVENTORY)
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

  const fulfillmentSetIndexes = await knex.raw(
    `
      select indexname, indexdef
      from pg_indexes
      where schemaname = 'public'
      and tablename = 'fulfillment_set'
    `
  )
  const fulfillmentSetIndexDefs = fulfillmentSetIndexes.rows as {
    indexname: string
    indexdef: string
  }[]
  assert.ok(
    !fulfillmentSetIndexDefs.some((i) => i.indexname === "IDX_fulfillment_set_name_unique"),
    "fulfillment_set name uniqueness must not be global"
  )
  assert.ok(
    fulfillmentSetIndexDefs.some(
      (i) =>
        i.indexname === "IDX_fulfillment_set_tenant_name_unique" &&
        i.indexdef.includes("(tenant_id, name)")
    ),
    "fulfillment_set name uniqueness must be tenant-aware"
  )

  const serviceZoneIndexes = await knex.raw(
    `
      select indexname, indexdef
      from pg_indexes
      where schemaname = 'public'
      and tablename = 'service_zone'
    `
  )
  const serviceZoneIndexDefs = serviceZoneIndexes.rows as {
    indexname: string
    indexdef: string
  }[]
  assert.ok(
    !serviceZoneIndexDefs.some((i) => i.indexname === "IDX_service_zone_name_unique"),
    "service_zone name uniqueness must not be global"
  )
  assert.ok(
    serviceZoneIndexDefs.some(
      (i) =>
        i.indexname === "IDX_service_zone_tenant_name_unique" &&
        i.indexdef.includes("(tenant_id, name)")
    ),
    "service_zone name uniqueness must be tenant-aware"
  )

  const tenantAPriceVisibility = await tenantVariantPriceVisibility(knex, TENANT_A)
  const tenantBPriceVisibility = await tenantVariantPriceVisibility(knex, TENANT_B)
  assert.equal(
    tenantAPriceVisibility.missingPriceSetCount,
    0,
    "tenant A product variants must see their linked price_sets"
  )
  assert.equal(
    tenantAPriceVisibility.missingPriceCount,
    0,
    "tenant A product variants must see at least one linked usd price"
  )
  assert.equal(
    tenantBPriceVisibility.missingPriceSetCount,
    0,
    "tenant B product variants must see their linked price_sets"
  )
  assert.equal(
    tenantBPriceVisibility.missingPriceCount,
    0,
    "tenant B product variants must see at least one linked usd price"
  )
  await assertTenantInventoryConfirmation(knex, inventory, TENANT_A)
  await assertTenantInventoryConfirmation(knex, inventory, TENANT_B)

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
