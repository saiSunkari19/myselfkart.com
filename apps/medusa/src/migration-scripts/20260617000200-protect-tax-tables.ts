import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  CURRENT_TENANT_SQL,
  addDerivedTenantResourceSql,
  addNullableDirectTenantResourceSql,
} from "../modules/tenant-context/tenant-resource-sql"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

async function tableExists(knex: KnexLike, table: string): Promise<boolean> {
  const result = await knex.raw(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
        and table_name = ?
      ) as exists
    `,
    [table]
  )

  return Boolean(result.rows?.[0]?.exists)
}

async function applySql(knex: KnexLike, statements: string[]) {
  for (const statement of statements) {
    await knex.raw(statement)
  }
}

function taxRateRuleTenantPolicy(): string {
  return `exists (
    select 1
    from "tax_rate" as tax_rate_owner
    join "tax_region" as tax_region_owner
      on tax_region_owner."id" = tax_rate_owner."tax_region_id"
    where tax_rate_owner."id" = "tax_rate_rule"."tax_rate_id"
    and tax_region_owner."tenant_id" = ${CURRENT_TENANT_SQL}
  )`
}

/**
 * Phase 3: tenant-isolate seller tax configuration before per-tenant taxes are
 * enabled. `tax_region` is the ownership root because Medusa's tax_rate rows
 * belong to a tax_region, and tax_rate_rule rows belong to a tax_rate.
 *
 * Existing platform-created tax regions remain `tenant_id = null`: they are
 * valid system rows but hidden from tenant contexts. Future seller tax setup
 * must run inside tenant context so the tax_region trigger stamps ownership.
 */
export default async function protectTaxTables({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Applying Selfkart tenant RLS to tax tables")

  if (await tableExists(knex, "tax_region")) {
    await applySql(knex, addNullableDirectTenantResourceSql("tax_region"))

    // Medusa's default tax_region uniqueness is global because the upstream
    // single-store model has one tax setup. Under tenant RLS, two sellers must be
    // able to configure tax for the same country/province independently.
    await knex.raw(`drop index if exists "IDX_tax_region_unique_country_province";`)
    await knex.raw(`drop index if exists "IDX_tax_region_unique_country_nullable_province";`)
    await knex.raw(`
      create unique index if not exists "IDX_tax_region_tenant_country_province_unique"
      on "tax_region" (
        coalesce("tenant_id", '00000000-0000-0000-0000-000000000000'::uuid),
        "country_code",
        "province_code"
      )
      where "province_code" is not null
      and "deleted_at" is null;
    `)
    await knex.raw(`
      create unique index if not exists "IDX_tax_region_tenant_country_nullable_province_unique"
      on "tax_region" (
        coalesce("tenant_id", '00000000-0000-0000-0000-000000000000'::uuid),
        "country_code"
      )
      where "province_code" is null
      and "deleted_at" is null;
    `)
  }

  if ((await tableExists(knex, "tax_rate")) && (await tableExists(knex, "tax_region"))) {
    await applySql(
      knex,
      addDerivedTenantResourceSql(
        "tax_rate",
        `exists (
          select 1
          from "tax_region" as owner_row
          where owner_row."id" = "tax_rate"."tax_region_id"
          and owner_row."tenant_id" = ${CURRENT_TENANT_SQL}
        )`
      )
    )
  }

  if ((await tableExists(knex, "tax_rate_rule")) && (await tableExists(knex, "tax_rate"))) {
    await applySql(knex, addDerivedTenantResourceSql("tax_rate_rule", taxRateRuleTenantPolicy()))
  }

  await knex.raw(`grant usage on schema public to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
  await knex.raw(`grant usage, select on all sequences in schema public to medusa_app;`)

  logger.info("Selfkart tenant RLS applied to tax tables")
}
