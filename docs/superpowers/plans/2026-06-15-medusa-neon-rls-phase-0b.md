# Medusa Neon RLS Phase 0B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove Medusa `2.15.5` can safely isolate tenants on Neon Postgres 17 RLS through pooled runtime connections.

**Architecture:** The database-only RLS gate has already passed. This plan adds Medusa, tenant context propagation, RLS migrations for the first commerce tables, two-tenant seed data, and API/workflow isolation tests.

**Tech Stack:** Medusa `2.15.5`, Neon Postgres `17`, runtime role `medusa_app`, migrator role `neondb_owner`, Node.js LTS, pnpm lockfile through Corepack.

---

## Required Context

Read the canonical plan first:

```txt
Medusa neon rls multitenant implementation plan · MD.md
```

Use Context7 before coding:

```txt
Medusa docs: /medusajs/medusa
Neon docs: /websites/neon
```

Use Neon MCP before database work:

```sql
select rolname, rolsuper, rolbypassrls, rolcanlogin
from pg_roles
where rolname in ('neondb_owner', 'medusa_app')
order by rolname;
```

Expected:

```txt
medusa_app|false|false|true
neondb_owner|false|true|true
```

---

## Task 1: Scaffold Pinned Medusa Backend

**Files:**

- Create: `apps/medusa/package.json`
- Create: `apps/medusa/medusa-config.ts`
- Create: `apps/medusa/.env.example`
- Create: `apps/medusa/tsconfig.json`

- [x] **Step 1: Create backend directory**

Run:

```sh
mkdir -p apps/medusa
cd apps/medusa
corepack pnpm init
```

Expected:

```txt
apps/medusa/package.json exists
```

- [x] **Step 2: Install exact Medusa versions**

Run:

```sh
corepack pnpm add @medusajs/medusa@2.15.5 @medusajs/framework@2.15.5 @medusajs/cli@2.15.5 @medusajs/admin-sdk@2.15.5 @medusajs/js-sdk@2.15.5
corepack pnpm add -D typescript@5.7.3
```

Expected:

```txt
pnpm-lock.yaml created
```

- [x] **Step 3: Verify exact versions**

Run:

```sh
corepack pnpm list @medusajs/medusa @medusajs/framework @medusajs/js-sdk --depth 0
```

Expected:

```txt
@medusajs/medusa@2.15.5
@medusajs/framework@2.15.5
@medusajs/js-sdk@2.15.5
```

- [x] **Step 4: Add env example**

Create `apps/medusa/.env.example`:

```env
MIGRATOR_DATABASE_URL=postgresql://neondb_owner:REPLACE_ME@REPLACE_ME/neondb?sslmode=require
APP_DATABASE_URL=postgresql://medusa_app:REPLACE_ME@REPLACE_ME-pooler.REPLACE_ME/neondb?sslmode=require
DATABASE_URL=${APP_DATABASE_URL}
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-32-plus-chars
COOKIE_SECRET=replace-with-32-plus-chars
```

- [x] **Step 5: Add TypeScript config**

Create `apps/medusa/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "Node16",
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "strict": true,
    "strictNullChecks": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": ".medusa/server"
  },
  "include": [
    "medusa-config.ts",
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".medusa",
    "dist",
    "build"
  ]
}
```

- [x] **Step 6: Commit**

Run:

```sh
git add apps/medusa/package.json apps/medusa/pnpm-lock.yaml apps/medusa/.env.example apps/medusa/medusa-config.ts apps/medusa/tsconfig.json
git commit -m "chore: scaffold pinned Medusa backend"
```

Expected:

```txt
commit created
```

---

## Task 2: Add Tenant Context Module

**Files:**

- Create: `apps/medusa/src/modules/tenant-context/store.ts`
- Create: `apps/medusa/src/modules/tenant-context/middleware.ts`
- Create: `apps/medusa/src/modules/tenant-context/index.ts`
- Create: `apps/medusa/src/api/middlewares.ts`

- [x] **Step 1: Create tenant context store**

Create `apps/medusa/src/modules/tenant-context/store.ts`:

```ts
import { AsyncLocalStorage } from "node:async_hooks"

export type TenantContext = {
  tenantId: string
  source: "domain" | "session" | "test"
}

const storage = new AsyncLocalStorage<TenantContext>()

export function runWithTenantContext<T>(
  context: TenantContext,
  callback: () => T
): T {
  return storage.run(context, callback)
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore()
}

export function requireTenantContext(): TenantContext {
  const context = getTenantContext()

  if (!context?.tenantId) {
    throw new Error("Tenant context is required for tenant-scoped database access")
  }

  return context
}
```

- [x] **Step 2: Add spike middleware**

Create `apps/medusa/src/modules/tenant-context/middleware.ts`:

```ts
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { runWithTenantContext } from "./store"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function tenantContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const tenantId = req.headers["x-selfkart-test-tenant-id"]

  if (typeof tenantId !== "string" || !UUID_PATTERN.test(tenantId)) {
    return res.status(403).json({
      message: "Valid tenant context is required",
    })
  }

  return runWithTenantContext({ tenantId, source: "test" }, next)
}
```

- [x] **Step 3: Add module export**

Create `apps/medusa/src/modules/tenant-context/index.ts`:

```ts
export * from "./store"
export * from "./middleware"
```

- [x] **Step 4: Register middleware**

Create `apps/medusa/src/api/middlewares.ts`:

```ts
import { defineMiddlewares } from "@medusajs/framework/http"

import { tenantContextMiddleware } from "../modules/tenant-context"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store*",
      middlewares: [tenantContextMiddleware],
    },
    {
      matcher: "/admin*",
      middlewares: [tenantContextMiddleware],
    },
  ],
})
```

- [ ] **Step 5: Commit**

Run:

```sh
git add apps/medusa/src/api/middlewares.ts apps/medusa/src/modules/tenant-context
git commit -m "feat: add Medusa tenant context store"
```

Expected:

```txt
commit created
```

---

## Task 3: Add Database Context Hook

**Files:**

- Create: `apps/medusa/src/modules/tenant-context/db-context.ts`
- Create: `apps/medusa/src/modules/tenant-context/patch-guard.ts`
- Modify: `apps/medusa/patches/@medusajs__utils@2.15.5.patch`

- [x] **Step 1: Add SQL helper**

Create `apps/medusa/src/modules/tenant-context/db-context.ts`:

```ts
import { requireTenantContext } from "./store"

export function getSetLocalTenantSql(): [string, string[]] {
  const { tenantId } = requireTenantContext()

  return ["select set_config('app.current_tenant', ?, true)", [tenantId]]
}
```

- [x] **Step 2: Inspect Medusa connection factory**

Run:

```sh
rg -n "createPgConnection|pg-connection|set_config|transaction" apps/medusa/node_modules/@medusajs
```

Expected:

```txt
The exact connection/transaction integration point is identified as @medusajs/utils@2.15.5 ModulesSdkUtils.createPgConnection.
```

- [x] **Step 3: Apply the minimum patch**

Patch `@medusajs/utils@2.15.5` through pnpm patched dependencies so tenant-scoped transactions execute:

```sql
select set_config('app.current_tenant', '<tenant-id>', true);
```

The third argument must be `true`, which makes the setting local to the current transaction.

- [x] **Step 4: Add startup guard**

Add a startup assertion that fails if the expected Medusa framework file or function signature is missing.

- [ ] **Step 5: Commit**

Run:

```sh
git add apps/medusa/src/modules/tenant-context apps/medusa/patches apps/medusa/package.json apps/medusa/pnpm-lock.yaml apps/medusa/medusa-config.ts
git commit -m "feat: set tenant context inside Medusa transactions"
```

Expected:

```txt
commit created
```

---

## Task 4: Add Phase 0 RLS Migration

**Files:**

- Create: `apps/medusa/src/modules/tenant-context/migrations/Migration20260615000100.ts`
- Create: `apps/medusa/src/modules/tenant-context/service.ts`
- Modify: `apps/medusa/src/modules/tenant-context/index.ts`
- Modify: `apps/medusa/medusa-config.ts`

- [x] **Step 1: Register tenant-context as a Medusa module**

Use the Medusa module pattern confirmed through Context7:

```ts
import { Module } from "@medusajs/framework/utils"
import TenantContextModuleService from "./service"

export const TENANT_CONTEXT_MODULE = "tenantContext"

export default Module(TENANT_CONTEXT_MODULE, {
  service: TenantContextModuleService,
})
```

- [x] **Step 2: Create migration**

Create `apps/medusa/src/modules/tenant-context/migrations/Migration20260615000100.ts` using Medusa's MikroORM migration style.

The migration must:

```txt
Add tenant_id to tenant-owned product/cart/customer/order tables and child tables.
Create tenant_id indexes.
Create a trigger that stamps tenant_id from app.current_tenant on insert.
Enable and force RLS.
Create USING and WITH CHECK policies based on current_setting('app.current_tenant', true).
Grant table DML and sequence usage to medusa_app.
Replace global unique indexes for handles/SKUs/tags/types/categories with tenant-aware unique indexes.
```

- [x] **Step 3: Verify table names from Medusa 2.15.5 package migrations**

Run against installed Medusa package migrations:

```sh
node -e "inspect @medusajs/product, @medusajs/cart, @medusajs/customer, and @medusajs/order migration files for create table statements"
```

Expected:

```txt
Tenant-owned child tables are included, not only product/cart/customer/order roots.
```

- [x] **Step 4: Verify migration on a temporary Neon branch**

Run:

```sh
DATABASE_URL='<direct-owner-url-for-temp-branch>' corepack pnpm exec medusa db:migrate
```

Expected:

```txt
MODULE: tenantContext
  Migrated Migration20260615000100
Migrations completed
```

Additional verification:

```txt
Temporary branch: phase0b-rls-migration-verify-2
Tenant isolation policies created: 49
Core table RLS forced: product, product_variant, cart, cart_line_item, customer, customer_address, order, order_line_item
Restricted medusa_app smoke passed: tenant_id stamped, no-context hidden, wrong-tenant hidden
```

- [ ] **Step 5: Commit**

Run:

```sh
git add apps/medusa/src/modules/tenant-context apps/medusa/medusa-config.ts
git commit -m "feat: add phase 0 tenant RLS migration"
```

Expected:

```txt
commit created
```

---

## Task 4A: Add RLS for Medusa Link Tables

**Status:** Required before Task 5.

**Why:** During temp-branch verification, `medusa db:migrate` created link tables after module migrations. `Migration20260615000100` cannot cover tables that do not exist until link sync runs.

**Examples:**

```txt
product_sales_channel
product_variant_inventory_item
product_variant_price_set
cart_payment_collection
order_cart
order_payment_collection
```

- [ ] **Step 1: Confirm Medusa-supported post-link migration mechanism**

Use Context7 and local package inspection to identify whether app-level migration scripts can run after link sync.

- [ ] **Step 2: Add link-table tenant protection**

Use the confirmed post-link mechanism to add tenant isolation to Medusa-generated link tables that connect tenant-owned records.

- [ ] **Step 3: Verify on a fresh temporary Neon branch**

Run full `corepack pnpm exec medusa db:migrate`, then assert link tables have tenant protection or are explicitly proven not tenant-facing.

- [ ] **Step 4: Commit**

Run:

```sh
git add apps/medusa docs/superpowers/plans/2026-06-15-medusa-neon-rls-phase-0b.md "Medusa neon rls multitenant implementation plan · MD.md"
git commit -m "feat: protect Medusa link tables with tenant RLS"
```

---

## Task 5: Seed Two Tenants and Write Isolation Tests

**Files:**

- Create: `apps/medusa/src/scripts/seed-tenants.ts`
- Create: `apps/medusa/tests/integration/rls/product-isolation.test.ts`
- Create: `apps/medusa/tests/integration/rls/concurrent-pooler.test.ts`

- [ ] **Step 1: Seed deterministic tenants**

Use these tenant ids:

```txt
Tenant A: 00000000-0000-0000-0000-00000000000a
Tenant B: 00000000-0000-0000-0000-00000000000b
```

Seed at least:

```txt
2 products per tenant
1 customer per tenant
1 cart per tenant
1 order per tenant
```

- [ ] **Step 2: Add product isolation test**

Required assertions:

```txt
Tenant A product list contains only Tenant A rows.
Tenant B product list contains only Tenant B rows.
Tenant A direct lookup of Tenant B product returns 404 or forbidden.
No tenant context returns 403 or zero rows.
```

- [ ] **Step 3: Add concurrent pooled test**

Required load:

```txt
ITERATIONS=500
CONCURRENCY=50
```

Each request must use the Neon pooled `APP_DATABASE_URL` and assert no cross-tenant rows.

- [ ] **Step 4: Commit**

Run:

```sh
git add apps/medusa/src/scripts/seed-tenants.ts apps/medusa/tests/integration/rls
git commit -m "test: add Medusa tenant isolation tests"
```

Expected:

```txt
commit created
```

---

## Task 6: Gate Decision

- [ ] **Step 1: Run database-only gate**

Run:

```sh
set -a
source .env
set +a
ITERATIONS=500 CONCURRENCY=50 bash phase0-rls-smoke/run.sh
```

Expected:

```txt
PASS: Postgres 17 RLS + SET LOCAL tenant isolation held under concurrent app connections
```

- [ ] **Step 2: Run Medusa isolation suite**

Run the Medusa integration test command defined by the scaffolded app.

Expected:

```txt
All product, cart, customer, order, background job, and concurrent pooler isolation tests pass.
```

- [ ] **Step 3: Decide**

If all tests pass:

```txt
Freeze Medusa 2.15.5 and Neon Postgres 17 through the 2-3 seller pilot.
Proceed to Phase 1.
```

If any test fails due unfixable tenant context leakage:

```txt
Stop shared-RLS path.
Switch to one Medusa instance/database per seller.
```
