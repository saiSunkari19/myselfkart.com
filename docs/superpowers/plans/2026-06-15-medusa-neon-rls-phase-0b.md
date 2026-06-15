# Medusa Neon RLS Phase 0B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove Medusa `2.15.5` can safely isolate tenants on Neon Postgres 17 RLS through pooled runtime connections.

**Architecture:** The database-only RLS gate has already passed. This plan adds Medusa, tenant context propagation, RLS migrations for the first commerce tables, two-tenant seed data, and API/workflow isolation tests.

**Tech Stack:** Medusa `2.15.5`, Neon Postgres `17`, runtime role `medusa_app`, migrator role `neondb_owner`, Node.js LTS, pnpm lockfile.

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

- [x] **Step 1: Create backend directory**

Run:

```sh
mkdir -p apps/medusa
cd apps/medusa
pnpm init
```

Expected:

```txt
apps/medusa/package.json exists
```

- [x] **Step 2: Install exact Medusa versions**

Run:

```sh
pnpm add @medusajs/medusa@2.15.5 @medusajs/framework@2.15.5 @medusajs/cli@2.15.5 @medusajs/admin-sdk@2.15.5 @medusajs/js-sdk@2.15.5
```

Expected:

```txt
pnpm-lock.yaml created
```

- [x] **Step 3: Verify exact versions**

Run:

```sh
pnpm list @medusajs/medusa @medusajs/framework @medusajs/js-sdk --depth 0
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

- [ ] **Step 5: Commit**

Run:

```sh
git add apps/medusa/package.json apps/medusa/pnpm-lock.yaml apps/medusa/.env.example
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

- [ ] **Step 1: Create tenant context store**

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

- [ ] **Step 2: Add spike middleware**

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

- [ ] **Step 3: Add module export**

Create `apps/medusa/src/modules/tenant-context/index.ts`:

```ts
export * from "./store"
export * from "./middleware"
```

- [ ] **Step 4: Commit**

Run:

```sh
git add apps/medusa/src/modules/tenant-context
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
- Modify: Medusa database connection hook or patch target discovered from `@medusajs/framework@2.15.5`

- [ ] **Step 1: Add SQL helper**

Create `apps/medusa/src/modules/tenant-context/db-context.ts`:

```ts
import { requireTenantContext } from "./store"

export function getSetLocalTenantSql(): [string, string[]] {
  const { tenantId } = requireTenantContext()

  return ["select set_config('app.current_tenant', ?, true)", [tenantId]]
}
```

- [ ] **Step 2: Inspect Medusa framework connection loader**

Run:

```sh
rg -n "pg-connection|connection.*loader|set_config|transaction" apps/medusa/node_modules/@medusajs/framework
```

Expected:

```txt
The exact connection/transaction integration point is identified for @medusajs/framework@2.15.5.
```

- [ ] **Step 3: Apply the minimum patch**

Patch the identified Medusa framework integration point so tenant-scoped transactions execute:

```sql
select set_config('app.current_tenant', '<tenant-id>', true);
```

The third argument must be `true`, which makes the setting local to the current transaction.

- [ ] **Step 4: Add startup guard**

Add a startup assertion that fails if the expected Medusa framework file or function signature is missing.

- [ ] **Step 5: Commit**

Run:

```sh
git add apps/medusa/src/modules/tenant-context apps/medusa/patches apps/medusa/package.json apps/medusa/pnpm-lock.yaml
git commit -m "feat: set tenant context inside Medusa transactions"
```

Expected:

```txt
commit created
```

---

## Task 4: Add Phase 0 RLS Migration

**Files:**

- Create: `apps/medusa/src/migrations/Migration20260615000100.ts`

- [ ] **Step 1: Create migration**

Create `apps/medusa/src/migrations/Migration20260615000100.ts` using Medusa's MikroORM migration style:

```ts
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

const TENANT_TABLES = [
  "product",
  "cart",
  "customer",
  "order",
]

export class Migration20260615000100 extends Migration {
  async up(): Promise<void> {
    for (const table of TENANT_TABLES) {
      this.addSql(`alter table if exists "${table}" add column if not exists tenant_id uuid;`)
      this.addSql(`create index if not exists "IDX_${table}_tenant_id" on "${table}" (tenant_id);`)
      this.addSql(`alter table if exists "${table}" enable row level security;`)
      this.addSql(`alter table if exists "${table}" force row level security;`)
      this.addSql(`
        create policy "${table}_tenant_isolation"
        on "${table}"
        for all
        using (
          tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
        )
        with check (
          tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
        );
      `)
      this.addSql(`grant select, insert, update, delete on "${table}" to medusa_app;`)
    }
  }

  async down(): Promise<void> {
    for (const table of TENANT_TABLES) {
      this.addSql(`drop policy if exists "${table}_tenant_isolation" on "${table}";`)
      this.addSql(`alter table if exists "${table}" disable row level security;`)
      this.addSql(`drop index if exists "IDX_${table}_tenant_id";`)
      this.addSql(`alter table if exists "${table}" drop column if exists tenant_id;`)
    }
  }
}
```

- [ ] **Step 2: Verify table names after Medusa migration**

Run after stock Medusa migrations:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected:

```txt
Confirm the exact Medusa table names before applying tenant migration.
```

- [ ] **Step 3: Commit**

Run:

```sh
git add apps/medusa/src/migrations/Migration20260615000100.ts
git commit -m "feat: add phase 0 tenant RLS migration"
```

Expected:

```txt
commit created
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
