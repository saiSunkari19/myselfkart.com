import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  CURRENT_TENANT_SQL,
  addDerivedTenantResourceSql,
  addDirectTenantResourceSql,
  addNullableDirectTenantResourceSql,
  ownerTenantExists,
  quoteIdent,
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

async function columnExists(
  knex: KnexLike,
  table: string,
  column: string
): Promise<boolean> {
  const result = await knex.raw(
    `
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
        and table_name = ?
        and column_name = ?
      ) as exists
    `,
    [table, column]
  )

  return Boolean(result.rows?.[0]?.exists)
}

async function applySql(knex: KnexLike, statements: string[]) {
  for (const statement of statements) {
    await knex.raw(statement)
  }
}

function allChecks(checks: string[]): string {
  return checks.join("\n    and ")
}

async function applyInventoryItemTenantIsolation(knex: KnexLike) {
  await knex.raw(`alter table if exists "inventory_item" add column if not exists "tenant_id" uuid;`)

  if (
    (await tableExists(knex, "product_variant_inventory_item")) &&
    (await tableExists(knex, "product_variant"))
  ) {
    const ambiguous = await knex.raw(`
      select pvii."inventory_item_id", count(distinct pv."tenant_id")::int as tenant_count
      from "product_variant_inventory_item" pvii
      join "product_variant" pv on pv."id" = pvii."variant_id"
      where pv."tenant_id" is not null
      group by pvii."inventory_item_id"
      having count(distinct pv."tenant_id") > 1
    `)

    if ((ambiguous.rows?.length ?? 0) > 0) {
      throw new Error(
        `Cannot tenantize inventory_item: ${ambiguous.rows?.length} inventory item(s) link to multiple tenants`
      )
    }

    await knex.raw(`
      with ownership as (
        select pvii."inventory_item_id", min(pv."tenant_id"::text)::uuid as tenant_id
        from "product_variant_inventory_item" pvii
        join "product_variant" pv on pv."id" = pvii."variant_id"
        where pv."tenant_id" is not null
        group by pvii."inventory_item_id"
      )
      update "inventory_item" ii
      set "tenant_id" = ownership.tenant_id
      from ownership
      where ii."id" = ownership."inventory_item_id"
      and ii."tenant_id" is null;
    `)
  }

  await knex.raw(`create index if not exists "IDX_inventory_item_tenant_id" on "inventory_item" ("tenant_id");`)
  await knex.raw(`drop index if exists "IDX_inventory_item_sku";`)
  await knex.raw(`drop index if exists "IDX_inventory_item_sku_unique";`)
  await knex.raw(`
    create unique index if not exists "IDX_inventory_item_tenant_sku"
    on "inventory_item" ("tenant_id", "sku")
    where deleted_at is null and sku is not null;
  `)
  await knex.raw(`drop trigger if exists "trg_inventory_item_tenant_id" on "inventory_item";`)
  await knex.raw(`
    create trigger "trg_inventory_item_tenant_id"
    before insert or update of "tenant_id" on "inventory_item"
    for each row
    execute function "selfkart_set_tenant_id"();
  `)
  await knex.raw(`alter table if exists "inventory_item" enable row level security;`)
  await knex.raw(`alter table if exists "inventory_item" force row level security;`)
  await knex.raw(`drop policy if exists "inventory_item_tenant_isolation" on "inventory_item";`)
  await knex.raw(`
    create policy "inventory_item_tenant_isolation"
    on "inventory_item"
    for all
    using ("tenant_id" = ${CURRENT_TENANT_SQL})
    with check ("tenant_id" = ${CURRENT_TENANT_SQL});
  `)
}

function inventoryLevelPolicy(): string {
  return allChecks([
    ownerTenantExists("inventory_item", "inventory_level", "inventory_item_id"),
    ownerTenantExists("stock_location", "inventory_level", "location_id"),
  ])
}

function reservationItemPolicy(): string {
  return allChecks([
    ownerTenantExists("inventory_item", "reservation_item", "inventory_item_id"),
    ownerTenantExists("stock_location", "reservation_item", "location_id"),
  ])
}

function productSalesChannelPolicy(): string {
  return allChecks([
    ownerTenantExists("product", "product_sales_channel", "product_id"),
    ownerTenantExists("sales_channel", "product_sales_channel", "sales_channel_id"),
  ])
}

function productVariantInventoryItemPolicy(): string {
  return allChecks([
    ownerTenantExists("product_variant", "product_variant_inventory_item", "variant_id"),
    ownerTenantExists("inventory_item", "product_variant_inventory_item", "inventory_item_id"),
  ])
}

function salesChannelStockLocationPolicy(): string {
  return allChecks([
    ownerTenantExists("sales_channel", "sales_channel_stock_location", "sales_channel_id"),
    ownerTenantExists("stock_location", "sales_channel_stock_location", "stock_location_id"),
  ])
}

async function applyTenantNameIndex(knex: KnexLike, table: string) {
  if ((await tableExists(knex, table)) && (await columnExists(knex, table, "tenant_id"))) {
    await knex.raw(`
      create index if not exists ${quoteIdent(`IDX_${table}_tenant_name`)}
      on ${quoteIdent(table)} ("tenant_id", "name")
      where deleted_at is null;
    `)
  }
}

export default async function protectInventoryStockSales({
  container,
}: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Applying Selfkart tenant RLS to inventory, stock-location, and sales-channel tables")

  if (await tableExists(knex, "inventory_item")) {
    await applyInventoryItemTenantIsolation(knex)
  }

  for (const table of ["stock_location_address", "stock_location"]) {
    if (await tableExists(knex, table)) {
      await applySql(knex, addDirectTenantResourceSql(table))
    }
  }

  if (await tableExists(knex, "sales_channel")) {
    await applySql(knex, addNullableDirectTenantResourceSql("sales_channel"))
  }

  const derivedTables = [
    { table: "inventory_level", policy: inventoryLevelPolicy() },
    { table: "reservation_item", policy: reservationItemPolicy() },
    { table: "product_sales_channel", policy: productSalesChannelPolicy() },
    {
      table: "product_variant_inventory_item",
      policy: productVariantInventoryItemPolicy(),
    },
    {
      table: "sales_channel_stock_location",
      policy: salesChannelStockLocationPolicy(),
    },
  ]

  for (const { table, policy } of derivedTables) {
    if (await tableExists(knex, table)) {
      await applySql(knex, addDerivedTenantResourceSql(table, policy))
    }
  }

  await applyTenantNameIndex(knex, "stock_location")
  await applyTenantNameIndex(knex, "sales_channel")

  await knex.raw(`grant usage on schema public to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
  await knex.raw(`grant usage, select on all sequences in schema public to medusa_app;`)

  logger.info("Selfkart tenant RLS applied to inventory, stock-location, and sales-channel tables")
}
