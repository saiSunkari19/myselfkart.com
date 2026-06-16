import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  addDerivedTenantResourceSql,
  addNullableDirectTenantResourceSql,
  ownerTenantExists,
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

/**
 * Phase 1 (buyer cart -> checkout -> order): tenant-isolate the pricing,
 * fulfillment-definition, and payment tables that the transactional storefront
 * flow touches. The cart/order tables themselves are already RLS'd (Phase 0B);
 * this closes the remaining checkout-pipeline tables so a seller can never read
 * another seller's prices, shipping rates, payment collections, or fulfillments.
 *
 * DELIBERATELY NOT scoped here (platform-shared reference / config — not seller
 * data, and Medusa creates a single shared set at boot or provisioning):
 *   region, region_country, region_payment_provider, payment_provider,
 *   fulfillment_provider, tax_provider, shipping_profile, shipping_option_type,
 *   refund_reason, price_preference, price_list(_rule).
 * region stays platform-shared on purpose: Medusa enforces one-country->one-region,
 * so per-tenant regions sharing a country collide. The currency/country container
 * is not sensitive; the sensitive data (prices, orders, payments, shipping rates)
 * IS tenant-scoped. Tax tables are deferred to Phase 3 (no tax setup in the pilot).
 *
 * Tables that may be created with no tenant context (boot/migration) use the
 * nullable-direct policy so a platform-null row stays valid and hidden from
 * tenants; tables only ever created inside a request/provisioning tenant context
 * still get a NOT-NULL tenant_id in practice via the stamping trigger.
 */

// Roots with no usable upward FK -> own tenant_id column (trigger-stamped).
// Nullable policy: tolerates platform-null rows (boot) and hides them from tenants.
const DIRECT_TABLES = [
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
]

// Children reachable by a single real FK to a now-tenant-owned table -> derive
// ownership from that parent (no extra column).
function derivedTables(): { table: string; policy: string }[] {
  return [
    { table: "price_rule", policy: ownerTenantExists("price", "price_rule", "price_id") },
    { table: "geo_zone", policy: ownerTenantExists("service_zone", "geo_zone", "service_zone_id") },
    {
      table: "shipping_option_rule",
      policy: ownerTenantExists("shipping_option", "shipping_option_rule", "shipping_option_id"),
    },
    { table: "capture", policy: ownerTenantExists("payment", "capture", "payment_id") },
    { table: "refund", policy: ownerTenantExists("payment", "refund", "payment_id") },
    {
      table: "fulfillment_item",
      policy: ownerTenantExists("fulfillment", "fulfillment_item", "fulfillment_id"),
    },
    {
      table: "fulfillment_label",
      policy: ownerTenantExists("fulfillment", "fulfillment_label", "fulfillment_id"),
    },
    // Link tables: scope by the endpoint that is already tenant-owned.
    {
      table: "shipping_option_price_set",
      policy: ownerTenantExists("shipping_option", "shipping_option_price_set", "shipping_option_id"),
    },
    {
      table: "location_fulfillment_set",
      policy: ownerTenantExists("stock_location", "location_fulfillment_set", "stock_location_id"),
    },
    {
      table: "location_fulfillment_provider",
      policy: ownerTenantExists(
        "stock_location",
        "location_fulfillment_provider",
        "stock_location_id"
      ),
    },
  ]
}

export default async function protectCheckoutTables({
  container,
}: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info(
    "Applying Selfkart tenant RLS to pricing, fulfillment, and payment checkout tables"
  )

  for (const table of DIRECT_TABLES) {
    if (await tableExists(knex, table)) {
      await applySql(knex, addNullableDirectTenantResourceSql(table))
    }
  }

  for (const { table, policy } of derivedTables()) {
    if (await tableExists(knex, table)) {
      await applySql(knex, addDerivedTenantResourceSql(table, policy))
    }
  }

  // These are tenant-owned tables. Medusa ships global name uniqueness for a
  // single-store setup, but under RLS tenant B cannot reuse tenant A's "Shipping"
  // fulfillment set or "US" service zone unless uniqueness includes tenant_id.
  await knex.raw(`drop index if exists "IDX_fulfillment_set_name_unique";`)
  await knex.raw(`
    create unique index if not exists "IDX_fulfillment_set_tenant_name_unique"
    on "fulfillment_set" ("tenant_id", "name")
    where "deleted_at" is null;
  `)
  await knex.raw(`drop index if exists "IDX_service_zone_name_unique";`)
  await knex.raw(`
    create unique index if not exists "IDX_service_zone_tenant_name_unique"
    on "service_zone" ("tenant_id", "name")
    where "deleted_at" is null;
  `)

  // Existing imported products may already have price_set / price rows created
  // before this checkout RLS migration. Backfill those rows from the owning
  // product variant. The nullable tenant trigger deliberately makes tenant_id
  // immutable after insert, so this owner-only migration disables those two
  // triggers only for the backfill and immediately enables them again.
  await knex.raw(`
    alter table "price_set" disable trigger "trg_price_set_tenant_id";
    alter table "price" disable trigger "trg_price_tenant_id";

    do $$
    declare
      tenant uuid;
    begin
      for tenant in
        select distinct p.tenant_id
        from product p
        join product_variant pv on pv.product_id = p.id
        join product_variant_price_set pvps on pvps.variant_id = pv.id
        where p.tenant_id is not null
      loop
        update price_set ps
        set tenant_id = tenant
        from product_variant_price_set pvps
        join product_variant pv on pv.id = pvps.variant_id
        join product p on p.id = pv.product_id
        where ps.id = pvps.price_set_id
        and p.tenant_id = tenant
        and ps.tenant_id is distinct from tenant;

        update price pr
        set tenant_id = tenant
        from product_variant_price_set pvps
        join product_variant pv on pv.id = pvps.variant_id
        join product p on p.id = pv.product_id
        where pr.price_set_id = pvps.price_set_id
        and p.tenant_id = tenant
        and pr.tenant_id is distinct from tenant;
      end loop;
    end;
    $$;

    alter table "price_set" enable trigger "trg_price_set_tenant_id";
    alter table "price" enable trigger "trg_price_tenant_id";
  `)

  // Re-grant runtime DML/sequence privileges: link tables and any objects created
  // after the module migrations need medusa_app access (medusa_app never owns
  // tables, so privileges must be (re)granted explicitly).
  await knex.raw(`grant usage on schema public to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
  await knex.raw(`grant usage, select on all sequences in schema public to medusa_app;`)

  logger.info(
    "Selfkart tenant RLS applied to pricing, fulfillment, and payment checkout tables"
  )
}
