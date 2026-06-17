import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-0000000000d1"
const TENANT_B = "00000000-0000-0000-0000-0000000000d2"

const TABLES = ["tax_region", "tax_rate", "tax_rate_rule"]

type SeedIds = {
  regionId: string
  rateId: string
  ruleId: string
}

function idsFor(tenantId: string): SeedIds {
  const suffix = tenantId.endsWith("d1") ? "a" : "b"
  return {
    regionId: `txreg_selfkart_rls_${suffix}`,
    rateId: `txrate_selfkart_rls_${suffix}`,
    ruleId: `txrule_selfkart_rls_${suffix}`,
  }
}

async function cleanup(knex: Knex, tenantId: string): Promise<void> {
  const ids = idsFor(tenantId)

  await runWithTenantContext({ tenantId, source: "test" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      await trx("tax_rate_rule").where({ id: ids.ruleId }).del()
      await trx("tax_rate").where({ id: ids.rateId }).del()
      await trx("tax_region").where({ id: ids.regionId }).del()
    })
  })

  // Pre-migration cleanup path: if RLS is not yet enabled, direct delete can
  // remove leftovers from a failed red run.
  await knex("tax_rate_rule").where({ id: ids.ruleId }).del()
  await knex("tax_rate").where({ id: ids.rateId }).del()
  await knex("tax_region").where({ id: ids.regionId }).del()
}

async function assertTaxTableProtection(knex: Knex): Promise<void> {
  const rls = await knex.raw(
    `
      select c.relname, c.relrowsecurity, c.relforcerowsecurity,
        (select count(*)::int from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relname = any(?)
    `,
    [TABLES]
  )

  const byName = new Map<string, any>(rls.rows.map((r: any) => [r.relname, r]))
  for (const table of TABLES) {
    const row = byName.get(table)
    assert.ok(row, `${table} must exist`)
    assert.equal(row.relrowsecurity, true, `${table} must have RLS enabled`)
    assert.equal(row.relforcerowsecurity, true, `${table} must have RLS forced`)
    assert.ok(row.policy_count >= 1, `${table} must have at least one RLS policy`)
  }

  const tenantColumn = await knex.raw(
    `
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
        and table_name = 'tax_region'
        and column_name = 'tenant_id'
      ) as exists
    `
  )
  assert.equal(
    tenantColumn.rows[0]?.exists,
    true,
    "tax_region must have a tenant_id owner column"
  )

  const taxRegionIndexes = await knex.raw(
    `
      select indexname, indexdef
      from pg_indexes
      where schemaname = 'public'
      and tablename = 'tax_region'
    `
  )
  const indexes = taxRegionIndexes.rows as { indexname: string; indexdef: string }[]
  assert.ok(
    !indexes.some(
      (i) =>
        i.indexname === "IDX_tax_region_unique_country_province" ||
        i.indexname === "IDX_tax_region_unique_country_nullable_province"
    ),
    "tax_region country/province uniqueness must not be global"
  )
  assert.ok(
    indexes.some((i) => i.indexname === "IDX_tax_region_tenant_country_province_unique"),
    "tax_region must have tenant-aware country/province uniqueness"
  )
  assert.ok(
    indexes.some(
      (i) => i.indexname === "IDX_tax_region_tenant_country_nullable_province_unique"
    ),
    "tax_region must have tenant-aware nullable-province uniqueness"
  )
}

async function seedTenantTax(knex: Knex, tenantId: string): Promise<SeedIds> {
  const ids = idsFor(tenantId)

  await runWithTenantContext({ tenantId, source: "test" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      await trx("tax_region").insert({
        id: ids.regionId,
        country_code: "us",
        provider_id: "tp_system",
      })
      await trx("tax_rate").insert({
        id: ids.rateId,
        tax_region_id: ids.regionId,
        code: `selfkart_${tenantId.slice(-2)}`,
        name: `Selfkart ${tenantId.slice(-2)} Tax`,
        rate: 5,
        is_default: true,
        is_combinable: false,
      })
      await trx("tax_rate_rule").insert({
        id: ids.ruleId,
        tax_rate_id: ids.rateId,
        reference: "product",
        reference_id: `prod_selfkart_tax_${tenantId.slice(-2)}`,
      })
    })
  })

  return ids
}

async function visibleIds(
  knex: Knex,
  tenantId: string,
  table: string,
  ids: string[]
): Promise<string[]> {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      const rows = await trx(table).whereIn("id", ids).select("id")
      return rows.map((r: { id: string }) => r.id).sort()
    })
  })
}

export default async function assertTaxRls({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Tax RLS assertions: checking tax_region, tax_rate, tax_rate_rule")

  await cleanup(knex, TENANT_A)
  await cleanup(knex, TENANT_B)

  try {
    await assertTaxTableProtection(knex)

    const a = await seedTenantTax(knex, TENANT_A)
    const b = await seedTenantTax(knex, TENANT_B)

    assert.deepEqual(
      await visibleIds(knex, TENANT_A, "tax_region", [a.regionId, b.regionId]),
      [a.regionId],
      "tenant A must see only its own tax_region"
    )
    assert.deepEqual(
      await visibleIds(knex, TENANT_B, "tax_region", [a.regionId, b.regionId]),
      [b.regionId],
      "tenant B must see only its own tax_region"
    )
    assert.deepEqual(
      await visibleIds(knex, TENANT_A, "tax_rate", [a.rateId, b.rateId]),
      [a.rateId],
      "tenant A must see only its own tax_rate"
    )
    assert.deepEqual(
      await visibleIds(knex, TENANT_B, "tax_rate", [a.rateId, b.rateId]),
      [b.rateId],
      "tenant B must see only its own tax_rate"
    )
    assert.deepEqual(
      await visibleIds(knex, TENANT_A, "tax_rate_rule", [a.ruleId, b.ruleId]),
      [a.ruleId],
      "tenant A must see only its own tax_rate_rule"
    )
    assert.deepEqual(
      await visibleIds(knex, TENANT_B, "tax_rate_rule", [a.ruleId, b.ruleId]),
      [b.ruleId],
      "tenant B must see only its own tax_rate_rule"
    )

    assert.equal(
      (await knex("tax_region").whereIn("id", [a.regionId, b.regionId]).select("id"))
        .length,
      0,
      "no-context reads must not see tenant-owned tax regions"
    )
    assert.equal(
      (await knex("tax_rate").whereIn("id", [a.rateId, b.rateId]).select("id")).length,
      0,
      "no-context reads must not see tenant-owned tax rates"
    )
    assert.equal(
      (await knex("tax_rate_rule").whereIn("id", [a.ruleId, b.ruleId]).select("id"))
        .length,
      0,
      "no-context reads must not see tenant-owned tax rate rules"
    )
  } finally {
    await cleanup(knex, TENANT_A)
    await cleanup(knex, TENANT_B)
  }

  logger.info("All tax RLS assertions passed.")
}
