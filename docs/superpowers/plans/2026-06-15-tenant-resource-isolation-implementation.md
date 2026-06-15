# Tenant Resource Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable tenant-resource isolation boundary and prove it by isolating Medusa Inventory, Stock Location, and Sales Channel data per seller.

**Architecture:** Keep the existing `tenant-context` module as the central isolation owner. Add a small registry/helper layer for direct and derived tenant resources, then add one migration script that applies RLS to inventory, stock-location, and sales-channel module tables. Seed/onboarding code will create tenant-owned sales channels, stock locations, and inventory levels so seller inventory is both isolated and non-zero.

**Tech Stack:** Medusa `2.15.5`, Neon Postgres `17`, MikroORM migrations / Medusa migration scripts, Node `node:test`, pnpm, Neon MCP for schema verification.

---

## File Structure

- Create `apps/medusa/src/modules/tenant-context/tenant-resource-sql.ts`
  - Shared SQL helpers for direct tenant-owned tables and derived tenant-owned tables.
  - Keeps future Shiprocket/Razorpay tenant table isolation from copying ad hoc SQL.
- Create `apps/medusa/src/migration-scripts/20260615000500-protect-inventory-stock-sales.ts`
  - Applies RLS to `inventory_item`, `inventory_level`, `reservation_item`, `stock_location`, `stock_location_address`, `sales_channel`, and stock/sales link tables if present.
  - Treats `inventory_item` as direct tenant-owned because Medusa creates inventory items before product-variant inventory links exist.
  - Backfills tenant IDs where direct tenant-owned tables can be derived safely.
- Create `apps/medusa/src/scripts/seed-tenant-inventory-resources.ts`
  - Idempotently creates one sales channel, one stock location, and inventory levels for the active tenant.
- Create `apps/medusa/src/scripts/assert-inventory-module-isolation.ts`
  - Uses Medusa query/Knex under tenant context to assert seller inventory isolation.
- Create `apps/medusa/src/scripts/assert-stock-sales-isolation.ts`
  - Asserts sales channels and stock locations are tenant-isolated.
- Create `apps/medusa/tests/integration/rls/inventory-module-isolation.test.js`
  - Seeds seller resources and proves inventory rows are isolated.
- Create `apps/medusa/tests/integration/rls/sales-channel-stock-location-isolation.test.js`
  - Proves stock locations and sales channels are isolated.
- Modify `apps/medusa/README.md`
  - Document that each seller needs a sales channel, stock location, and inventory levels.
- Modify `Medusa neon rls multitenant implementation plan · MD.md`
  - Record the new module-isolation gate and the remaining `api_key` follow-up.

---

## Task 1: Add Tenant Resource SQL Helpers

**Files:**

- Create: `apps/medusa/src/modules/tenant-context/tenant-resource-sql.ts`

- [ ] **Step 1: Create the helper file**

Create `apps/medusa/src/modules/tenant-context/tenant-resource-sql.ts`:

```ts
export const CURRENT_TENANT_SQL =
  "nullif(current_setting('app.current_tenant', true), '')::uuid"

export function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

export function addDirectTenantResourceSql(table: string): string[] {
  const quotedTable = quoteIdent(table)
  const policyName = quoteIdent(`${table}_tenant_isolation`)
  const triggerName = quoteIdent(`trg_${table}_tenant_id`)
  const indexName = quoteIdent(`IDX_${table}_tenant_id`)

  return [
    `alter table if exists ${quotedTable} add column if not exists "tenant_id" uuid;`,
    `create index if not exists ${indexName} on ${quotedTable} ("tenant_id");`,
    `drop trigger if exists ${triggerName} on ${quotedTable};`,
    `
      create trigger ${triggerName}
      before insert or update of "tenant_id" on ${quotedTable}
      for each row
      execute function "selfkart_set_tenant_id"();
    `,
    `alter table if exists ${quotedTable} enable row level security;`,
    `alter table if exists ${quotedTable} force row level security;`,
    `drop policy if exists ${policyName} on ${quotedTable};`,
    `
      create policy ${policyName}
      on ${quotedTable}
      for all
      using ("tenant_id" = ${CURRENT_TENANT_SQL})
      with check ("tenant_id" = ${CURRENT_TENANT_SQL});
    `,
  ]
}

export function addDerivedTenantResourceSql(
  table: string,
  policyExpression: string
): string[] {
  const quotedTable = quoteIdent(table)
  const policyName = quoteIdent(`${table}_tenant_isolation`)

  return [
    `alter table if exists ${quotedTable} enable row level security;`,
    `alter table if exists ${quotedTable} force row level security;`,
    `drop policy if exists ${policyName} on ${quotedTable};`,
    `
      create policy ${policyName}
      on ${quotedTable}
      for all
      using (${policyExpression})
      with check (${policyExpression});
    `,
  ]
}
```

- [ ] **Step 2: Run TypeScript check**

Run:

```sh
cd apps/medusa
corepack pnpm exec tsc --noEmit
```

Expected:

```txt
exit code 0
```

- [ ] **Step 3: Commit**

Run:

```sh
git add apps/medusa/src/modules/tenant-context/tenant-resource-sql.ts
git commit -m "feat: add tenant resource SQL helpers"
```

Expected:

```txt
commit created
```

---

## Task 2: Add Inventory, Stock Location, and Sales Channel RLS Migration Script

**Files:**

- Create: `apps/medusa/src/migration-scripts/20260615000500-protect-inventory-stock-sales.ts`
- Modify: `apps/medusa/src/modules/tenant-context/tenant-resource-sql.ts` if helper gaps are found.

- [ ] **Step 1: Write a failing schema/isolation inspection command**

Run this against the current DB before implementing the migration:

```sh
cd apps/medusa
set -a; source .env; set +a
node -e '
const { Client } = require("pg")
const client = new Client({ connectionString: process.env.APP_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
;(async () => {
  await client.connect()
  const result = await client.query(`
    select c.relname, c.relrowsecurity, c.relforcerowsecurity,
      exists (
        select 1 from information_schema.columns
        where table_schema = $$public$$
        and table_name = c.relname
        and column_name = $$tenant_id$$
      ) as has_tenant_id
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = $$public$$
      and c.relkind = $$r$$
      and c.relname in ($$inventory_item$$,$$inventory_level$$,$$reservation_item$$,$$stock_location$$,$$stock_location_address$$,$$sales_channel$$)
    order by c.relname
  `)
  console.log(JSON.stringify(result.rows, null, 2))
  await client.end()
})().catch((e) => { console.error(e); process.exit(1) })
'
```

Expected before implementation:

```txt
inventory_item, inventory_level, reservation_item, stock_location, stock_location_address, and sales_channel show RLS disabled and no tenant_id where applicable.
```

- [ ] **Step 2: Create migration script**

Create `apps/medusa/src/migration-scripts/20260615000500-protect-inventory-stock-sales.ts`:

```ts
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  CURRENT_TENANT_SQL,
  addDerivedTenantResourceSql,
  addDirectTenantResourceSql,
  quoteIdent,
} from "../modules/tenant-context/tenant-resource-sql"

async function tableExists(knex: any, table: string): Promise<boolean> {
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

async function columnExists(knex: any, table: string, column: string): Promise<boolean> {
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

async function applySql(knex: any, statements: string[]) {
  for (const statement of statements) {
    await knex.raw(statement)
  }
}

async function applyInventoryItemTenantIsolation(knex: any) {
  const ambiguous = await knex.raw(`
    select pvii."inventory_item_id", count(distinct pv."tenant_id")::int as tenant_count
    from "product_variant_inventory_item" pvii
    join "product_variant" pv on pv."id" = pvii."variant_id"
    where pv."tenant_id" is not null
    group by pvii."inventory_item_id"
    having count(distinct pv."tenant_id") > 1
  `)

  if (ambiguous.rows.length > 0) {
    throw new Error(
      `Cannot tenantize inventory_item: ${ambiguous.rows.length} inventory item(s) link to multiple tenants`
    )
  }

  await knex.raw(`alter table if exists "inventory_item" add column if not exists "tenant_id" uuid;`)
  await knex.raw(`
    with ownership as (
      select pvii."inventory_item_id", min(pv."tenant_id") as tenant_id
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
  await knex.raw(`create index if not exists "IDX_inventory_item_tenant_id" on "inventory_item" ("tenant_id");`)
  await knex.raw(`drop index if exists "IDX_inventory_item_sku";`)
  await knex.raw(`drop index if exists "IDX_inventory_item_sku_unique";`)
  await knex.raw(`create unique index if not exists "IDX_inventory_item_tenant_sku" on "inventory_item" ("tenant_id", "sku") where deleted_at is null and sku is not null;`)
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
  return `exists (
    select 1
    from "inventory_item" ii
    where ii."id" = "inventory_level"."inventory_item_id"
    and ii."tenant_id" = ${CURRENT_TENANT_SQL}
  )`
}

function reservationItemPolicy(): string {
  return `exists (
    select 1
    from "inventory_item" ii
    where ii."id" = "reservation_item"."inventory_item_id"
    and ii."tenant_id" = ${CURRENT_TENANT_SQL}
  )`
}

function salesChannelStockLocationPolicy(): string {
  return `exists (
    select 1
    from "sales_channel" sc
    where sc."id" = "sales_channel_stock_location"."sales_channel_id"
    and sc."tenant_id" = ${CURRENT_TENANT_SQL}
  )
  and exists (
    select 1
    from "stock_location" sl
    where sl."id" = "sales_channel_stock_location"."stock_location_id"
    and sl."tenant_id" = ${CURRENT_TENANT_SQL}
  )`
}

export default async function protectInventoryStockSales({
  container,
}: ExecArgs): Promise<void> {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Applying Selfkart tenant RLS to inventory, stock-location, and sales-channel tables")

  if (await tableExists(knex, "inventory_item")) {
    await applyInventoryItemTenantIsolation(knex)
  }

  for (const table of ["stock_location_address", "stock_location", "sales_channel"]) {
    if (await tableExists(knex, table)) {
      await applySql(knex, addDirectTenantResourceSql(table))
    }
  }

  if (await tableExists(knex, "inventory_level")) {
    await applySql(knex, addDerivedTenantResourceSql("inventory_level", inventoryLevelPolicy()))
  }

  if (await tableExists(knex, "reservation_item")) {
    await applySql(knex, addDerivedTenantResourceSql("reservation_item", reservationItemPolicy()))
  }

  if (await tableExists(knex, "sales_channel_stock_location")) {
    await applySql(
      knex,
      addDerivedTenantResourceSql(
        "sales_channel_stock_location",
        salesChannelStockLocationPolicy()
      )
    )
  }

  if (await tableExists(knex, "stock_location") && await columnExists(knex, "stock_location", "tenant_id")) {
    await knex.raw(`create index if not exists "IDX_stock_location_tenant_name" on "stock_location" ("tenant_id", "name") where deleted_at is null;`)
  }

  if (await tableExists(knex, "sales_channel") && await columnExists(knex, "sales_channel", "tenant_id")) {
    await knex.raw(`create index if not exists "IDX_sales_channel_tenant_name" on "sales_channel" ("tenant_id", "name") where deleted_at is null;`)
  }

  await knex.raw(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
  await knex.raw(`grant usage, select on all sequences in schema public to medusa_app;`)

  logger.info("Selfkart tenant RLS applied to inventory, stock-location, and sales-channel tables")
}
```

- [ ] **Step 3: Run TypeScript check**

Run:

```sh
cd apps/medusa
corepack pnpm exec tsc --noEmit
```

Expected:

```txt
exit code 0
```

- [ ] **Step 4: Commit**

Run:

```sh
git add apps/medusa/src/modules/tenant-context/tenant-resource-sql.ts apps/medusa/src/migration-scripts/20260615000500-protect-inventory-stock-sales.ts
git commit -m "feat: protect inventory and stock modules with tenant RLS"
```

Expected:

```txt
commit created
```

---

## Task 3: Add Tenant Inventory Resource Seed Script

**Files:**

- Create: `apps/medusa/src/scripts/seed-tenant-inventory-resources.ts`

- [ ] **Step 1: Create seed script**

Create `apps/medusa/src/scripts/seed-tenant-inventory-resources.ts`:

```ts
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Input = {
  tenantId: string
  sellerName: string
  stockedQuantity: number
}

function readInput(): Input {
  const tenantId = process.env.SELLER_ADMIN_TENANT_ID ?? process.env.TENANT_ID ?? ""
  const sellerName = process.env.SELLER_NAME ?? "Selfkart Seller"
  const stockedQuantity = Number.parseInt(process.env.STOCKED_QUANTITY ?? "100", 10)

  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("SELLER_ADMIN_TENANT_ID or TENANT_ID must be a valid UUID")
  }

  if (!Number.isFinite(stockedQuantity) || stockedQuantity <= 0) {
    throw new Error("STOCKED_QUANTITY must be a positive integer")
  }

  return { tenantId, sellerName, stockedQuantity }
}

async function upsertTenantSalesChannel(trx: Knex.Transaction, sellerName: string): Promise<string> {
  const name = `${sellerName} Sales Channel`
  const existing = await trx("sales_channel").where({ name }).first("id")

  if (existing?.id) {
    return existing.id
  }

  const id = `sc_selfkart_${Date.now()}_${Math.random().toString(16).slice(2)}`
  await trx("sales_channel").insert({
    id,
    name,
    description: `Tenant sales channel for ${sellerName}`,
    is_disabled: false,
    metadata: JSON.stringify({ selfkart_seeded: true }),
  })

  return id
}

async function upsertTenantStockLocation(trx: Knex.Transaction, sellerName: string): Promise<string> {
  const name = `${sellerName} Stock Location`
  const existing = await trx("stock_location").where({ name }).first("id")

  if (existing?.id) {
    return existing.id
  }

  const id = `sloc_selfkart_${Date.now()}_${Math.random().toString(16).slice(2)}`
  await trx("stock_location").insert({
    id,
    name,
    metadata: JSON.stringify({ selfkart_seeded: true }),
  })

  return id
}

async function linkProductsToSalesChannel(trx: Knex.Transaction, salesChannelId: string) {
  const products = await trx("product").select("id")

  for (const product of products) {
    const exists = await trx("product_sales_channel")
      .where({ product_id: product.id, sales_channel_id: salesChannelId })
      .first("id")

    if (!exists) {
      await trx("product_sales_channel").insert({
        id: `prodsc_selfkart_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        product_id: product.id,
        sales_channel_id: salesChannelId,
      })
    }
  }
}

async function ensureInventoryLevels(
  trx: Knex.Transaction,
  stockLocationId: string,
  stockedQuantity: number
) {
  const inventoryItems = await trx("inventory_item as ii")
    .select("ii.id")
    .whereExists(function () {
      this.select(trx.raw("1"))
        .from("product_variant_inventory_item as pvii")
        .whereRaw('pvii."inventory_item_id" = ii."id"')
    })

  for (const item of inventoryItems) {
    const exists = await trx("inventory_level")
      .where({
        inventory_item_id: item.id,
        location_id: stockLocationId,
      })
      .first("id")

    if (exists) {
      await trx("inventory_level")
        .where({ id: exists.id })
        .update({
          stocked_quantity: stockedQuantity,
          raw_stocked_quantity: JSON.stringify({ value: String(stockedQuantity), precision: 20 }),
          updated_at: trx.fn.now(),
        })
      continue
    }

    await trx("inventory_level").insert({
      id: `ilev_selfkart_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      inventory_item_id: item.id,
      location_id: stockLocationId,
      stocked_quantity: stockedQuantity,
      reserved_quantity: 0,
      incoming_quantity: 0,
      raw_stocked_quantity: JSON.stringify({ value: String(stockedQuantity), precision: 20 }),
      raw_reserved_quantity: JSON.stringify({ value: "0", precision: 20 }),
      raw_incoming_quantity: JSON.stringify({ value: "0", precision: 20 }),
      metadata: JSON.stringify({ selfkart_seeded: true }),
    })
  }
}

export default async function seedTenantInventoryResources({
  container,
}: ExecArgs): Promise<void> {
  const input = readInput()
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  await runWithTenantContext({ tenantId: input.tenantId, source: "session" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [input.tenantId])
      const salesChannelId = await upsertTenantSalesChannel(trx, input.sellerName)
      const stockLocationId = await upsertTenantStockLocation(trx, input.sellerName)
      await linkProductsToSalesChannel(trx, salesChannelId)
      await ensureInventoryLevels(trx, stockLocationId, input.stockedQuantity)
    })
  })

  logger.info(
    `Tenant inventory resources ready: tenant_id=${input.tenantId} seller=${input.sellerName}`
  )
}
```

- [ ] **Step 2: Run TypeScript check**

Run:

```sh
cd apps/medusa
corepack pnpm exec tsc --noEmit
```

Expected:

```txt
exit code 0
```

- [ ] **Step 3: Commit**

Run:

```sh
git add apps/medusa/src/scripts/seed-tenant-inventory-resources.ts
git commit -m "feat: seed tenant inventory resources"
```

Expected:

```txt
commit created
```

---

## Task 4: Add Inventory and Stock/Sales Isolation Assertions

**Files:**

- Create: `apps/medusa/src/scripts/assert-inventory-module-isolation.ts`
- Create: `apps/medusa/src/scripts/assert-stock-sales-isolation.ts`

- [ ] **Step 1: Create inventory assertion script**

Create `apps/medusa/src/scripts/assert-inventory-module-isolation.ts`:

```ts
import assert from "node:assert/strict"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

async function inventorySummaryFor(knex: Knex, tenantId: string) {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      const result = await trx.raw(`
        select
          count(*)::int as inventory_items,
          count(*) filter (where exists (
            select 1 from product_variant_inventory_item pvii
            join product_variant pv on pv.id = pvii.variant_id
            join product p on p.id = pv.product_id
            where pvii.inventory_item_id = inventory_item.id
            and (
              p.handle like 'kids-%'
              or p.handle like 'men-%'
              or p.handle like 'women-%'
            )
          ))::int as clothing_items
        from inventory_item
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
  const noContext = await knex.raw("select count(*)::int as count from inventory_item")

  assert.equal(noContext.rows[0].count, 0, "no tenant context must see zero inventory items")
  assert.ok(tenantA.inventory_items > 0, "tenant A must see its inventory items")
  assert.ok(tenantB.inventory_items > 0, "tenant B must see its inventory items")
  assert.ok(Number(tenantA.clothing_items) > 0, "tenant A must see clothing inventory")
  assert.equal(Number(tenantB.clothing_items), 0, "tenant B must not see clothing inventory")

  logger.info("INVENTORY MODULE PASS: inventory_item RLS is tenant-isolated")
}
```

- [ ] **Step 2: Create stock/sales assertion script**

Create `apps/medusa/src/scripts/assert-stock-sales-isolation.ts`:

```ts
import assert from "node:assert/strict"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

async function summaryFor(knex: Knex, tenantId: string) {
  return runWithTenantContext({ tenantId, source: "test" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      const result = await trx.raw(`
        select
          (select count(*)::int from stock_location) as stock_locations,
          (select count(*)::int from sales_channel) as sales_channels,
          (select count(*)::int from inventory_level where stocked_quantity > 0) as positive_inventory_levels
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
      (select count(*)::int from sales_channel) as sales_channels,
      (select count(*)::int from inventory_level) as inventory_levels
  `)

  assert.equal(noContext.rows[0].stock_locations, 0, "no context must see zero stock locations")
  assert.equal(noContext.rows[0].sales_channels, 0, "no context must see zero sales channels")
  assert.equal(noContext.rows[0].inventory_levels, 0, "no context must see zero inventory levels")
  assert.ok(tenantA.stock_locations > 0, "tenant A must see its stock location")
  assert.ok(tenantB.stock_locations > 0, "tenant B must see its stock location")
  assert.ok(tenantA.sales_channels > 0, "tenant A must see its sales channel")
  assert.ok(tenantB.sales_channels > 0, "tenant B must see its sales channel")
  assert.ok(tenantA.positive_inventory_levels > 0, "tenant A must have positive inventory levels")
  assert.ok(tenantB.positive_inventory_levels > 0, "tenant B must have positive inventory levels")

  logger.info("STOCK/SALES PASS: stock locations, sales channels, and inventory levels are tenant-isolated")
}
```

- [ ] **Step 3: Run TypeScript check**

Run:

```sh
cd apps/medusa
corepack pnpm exec tsc --noEmit
```

Expected:

```txt
exit code 0
```

- [ ] **Step 4: Commit**

Run:

```sh
git add apps/medusa/src/scripts/assert-inventory-module-isolation.ts apps/medusa/src/scripts/assert-stock-sales-isolation.ts
git commit -m "test: add module isolation assertion scripts"
```

Expected:

```txt
commit created
```

---

## Task 5: Add RLS Integration Tests

**Files:**

- Create: `apps/medusa/tests/integration/rls/inventory-module-isolation.test.js`
- Create: `apps/medusa/tests/integration/rls/sales-channel-stock-location-isolation.test.js`

- [ ] **Step 1: Create inventory module test**

Create `apps/medusa/tests/integration/rls/inventory-module-isolation.test.js`:

```js
const { execFileSync } = require("node:child_process")
const test = require("node:test")

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

function requireAppDatabaseUrl() {
  const databaseUrl = process.env.APP_DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("APP_DATABASE_URL or DATABASE_URL is required for RLS integration tests")
  }

  return databaseUrl
}

function medusaExec(script, extraEnv = {}) {
  execFileSync("corepack", ["pnpm", "exec", "medusa", "exec", script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
      DATABASE_URL: requireAppDatabaseUrl(),
    },
    stdio: "inherit",
  })
}

test("inventory items are isolated by tenant", () => {
  medusaExec("./src/scripts/seed-tenant-inventory-resources.ts", {
    SELLER_ADMIN_TENANT_ID: TENANT_A,
    SELLER_NAME: "Tenant A",
    STOCKED_QUANTITY: "100",
  })
  medusaExec("./src/scripts/seed-tenant-inventory-resources.ts", {
    SELLER_ADMIN_TENANT_ID: TENANT_B,
    SELLER_NAME: "Tenant B",
    STOCKED_QUANTITY: "100",
  })
  medusaExec("./src/scripts/assert-inventory-module-isolation.ts")
})
```

- [ ] **Step 2: Create stock/sales module test**

Create `apps/medusa/tests/integration/rls/sales-channel-stock-location-isolation.test.js`:

```js
const { execFileSync } = require("node:child_process")
const test = require("node:test")

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

function requireAppDatabaseUrl() {
  const databaseUrl = process.env.APP_DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("APP_DATABASE_URL or DATABASE_URL is required for RLS integration tests")
  }

  return databaseUrl
}

function medusaExec(script, extraEnv = {}) {
  execFileSync("corepack", ["pnpm", "exec", "medusa", "exec", script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
      DATABASE_URL: requireAppDatabaseUrl(),
    },
    stdio: "inherit",
  })
}

test("stock locations and sales channels are isolated by tenant", () => {
  medusaExec("./src/scripts/seed-tenant-inventory-resources.ts", {
    SELLER_ADMIN_TENANT_ID: TENANT_A,
    SELLER_NAME: "Tenant A",
    STOCKED_QUANTITY: "100",
  })
  medusaExec("./src/scripts/seed-tenant-inventory-resources.ts", {
    SELLER_ADMIN_TENANT_ID: TENANT_B,
    SELLER_NAME: "Tenant B",
    STOCKED_QUANTITY: "100",
  })
  medusaExec("./src/scripts/assert-stock-sales-isolation.ts")
})
```

- [ ] **Step 3: Run new tests and verify they fail before migration**

Run before applying Task 2 migration to a DB:

```sh
cd apps/medusa
APP_DATABASE_URL="$DATABASE_URL" corepack pnpm test:rls
```

Expected before migration:

```txt
The new inventory/stock/sales tests fail because module tables are not tenant-RLS'd yet.
```

- [ ] **Step 4: Run new tests after migration**

Run after migrating a disposable Neon branch:

```sh
cd apps/medusa
APP_DATABASE_URL="<pooled medusa_app url>" ITERATIONS=500 CONCURRENCY=50 corepack pnpm test:rls
```

Expected after implementation:

```txt
All RLS tests pass, including inventory-module-isolation and sales-channel-stock-location-isolation.
```

- [ ] **Step 5: Commit**

Run:

```sh
git add apps/medusa/tests/integration/rls/inventory-module-isolation.test.js apps/medusa/tests/integration/rls/sales-channel-stock-location-isolation.test.js
git commit -m "test: add inventory and stock module isolation tests"
```

Expected:

```txt
commit created
```

---

## Task 6: Verify on Disposable Neon Branch

**Files:**

- No source files expected.

- [ ] **Step 1: Create a temporary Neon branch**

Use Neon MCP `create_branch` for project `jolly-rice-01919313`.

Expected:

```txt
Temporary branch id and name returned.
```

- [ ] **Step 2: Get owner and app connection strings**

Use Neon MCP `get_connection_string` twice:

```txt
neondb_owner direct URL for migrations
medusa_app pooled URL for runtime tests
```

Do not print passwords or full URLs in chat.

- [ ] **Step 3: Run migrations**

Run:

```sh
cd apps/medusa
DATABASE_URL="<temporary neondb_owner direct url>" corepack pnpm db:migrate
```

Expected:

```txt
Migration scripts include 20260615000500-protect-inventory-stock-sales and complete successfully.
```

- [ ] **Step 4: Verify schema through Neon MCP**

Run this SQL on the temporary branch:

```sql
select c.relname,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced,
       exists (
         select 1 from information_schema.columns
         where table_schema = 'public'
           and table_name = c.relname
           and column_name = 'tenant_id'
       ) as has_tenant_id
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'inventory_item',
    'inventory_level',
    'reservation_item',
    'stock_location',
    'stock_location_address',
    'sales_channel'
  )
order by c.relname;
```

Expected:

```txt
All six tables have rls_enabled=true and rls_forced=true.
stock_location, stock_location_address, and sales_channel have tenant_id=true.
```

- [ ] **Step 5: Run full RLS test suite**

Run:

```sh
cd apps/medusa
APP_DATABASE_URL="<temporary medusa_app pooled url>" ITERATIONS=500 CONCURRENCY=50 corepack pnpm test:rls
```

Expected:

```txt
All tests pass.
```

- [ ] **Step 6: Delete temporary Neon branch**

Use Neon MCP `delete_branch` for the temporary branch.

Expected:

```txt
Temporary branch deleted.
```

---

## Task 7: Update Docs and Main Plan

**Files:**

- Modify: `apps/medusa/README.md`
- Modify: `Medusa neon rls multitenant implementation plan · MD.md`

- [ ] **Step 1: Update Medusa README**

Add an Inventory section to `apps/medusa/README.md`:

```md
## Seller Inventory Setup

Each seller must have tenant-owned inventory resources:

- one sales channel
- one stock location
- one inventory level per managed inventory item

After importing products for a seller, run:

```sh
SELLER_ADMIN_TENANT_ID=<tenant-uuid> \
SELLER_NAME="Acme Clothing" \
STOCKED_QUANTITY=100 \
DATABASE_URL="$APP_DATABASE_URL" \
corepack pnpm exec medusa exec ./src/scripts/seed-tenant-inventory-resources.ts
```

This script is idempotent. It creates/reuses the seller sales channel and stock
location, links visible tenant products to the seller sales channel, and creates
positive inventory levels at the seller stock location.
```

- [ ] **Step 2: Update implementation plan handoff**

In `Medusa neon rls multitenant implementation plan · MD.md`, update the handoff:

```txt
Inventory, stock-location, and sales-channel module isolation is now covered by
the tenant-resource isolation task. api_key remains the next tenant-nullable
platform/seller split unless fixed separately.
```

- [ ] **Step 3: Commit**

Run:

```sh
git add apps/medusa/README.md "Medusa neon rls multitenant implementation plan · MD.md"
git commit -m "docs: document tenant inventory setup"
```

Expected:

```txt
commit created
```

---

## Self-Review Checklist

- [x] Spec coverage: reusable registry, inventory, stock locations, sales channels, seed/onboarding, tests, Neon verification, and Shiprocket/Razorpay follow-on are covered.
- [x] No incomplete marker text remains in this plan.
- [x] Helper/function names are consistent across tasks.
- [x] The plan leaves `api_key` as an explicit tracked follow-up unless the implementation expands scope.
- [x] The plan uses Context7 findings: inventory items link to variants, stock locations link to sales channels, inventory levels hold stock quantity.
