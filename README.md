# SelfKart — Multi-Tenant E-commerce on Medusa + Neon Postgres RLS

One Medusa backend, one Next.js storefront, one Neon Postgres database, safely serving
many independent sellers. Tenant isolation is enforced at the database layer with
PostgreSQL Row-Level Security, not in application code you have to remember to write.

SelfKart is the engine behind MySelfKart. It gives small sellers their own branded
online store — their domain, their customers, their Razorpay account, no commission —
while we run a single shared platform. The reason this repo exists is the part in the
middle: how one database serves every seller without a single row ever leaking across
tenants.

This README is the technical tour. If you just want to run it, jump to Quickstart at
the bottom.

## The problem

A store-builder SaaS usually picks one of two painful options.

The first is a separate database, or schema, per seller. Isolation is strong, but the
operations are brutal: a migration to run N times, N connection pools, N backups, N
upgrades. It doesn't scale to hundreds of long-tail sellers.

The second is one shared database with isolation enforced in application code. It's
cheap to run, but every query in every service has to remember `WHERE tenant_id = ?`.
One forgotten filter, anywhere — core code, a third-party module, a background job, an
admin widget — is a cross-tenant data leak.

Medusa v2 is a large framework with dozens of modules and machine-generated link
tables. Auditing every query path by hand isn't realistic. So the boundary is pushed
down into Postgres instead.

## The approach

Tenant identity is derived on the server, set as a transaction-local Postgres variable,
and enforced by RLS policies on every tenant-owned table. If the tenant context is
missing, queries return zero rows. The system fails closed.

A few decisions make that hold:

- The runtime role, `medusa_app`, has `LOGIN` but not `BYPASSRLS`, and doesn't own the
  tenant tables. It cannot read across tenants, even with a buggy query.
- Every tenant-scoped table has RLS enabled and forced, with `USING` and `WITH CHECK`
  policies keyed on `current_setting('app.current_tenant', true)`.
- A `BEFORE INSERT OR UPDATE` trigger stamps `tenant_id` from the transaction context,
  so application code never has to pass it.
- The browser never asserts a tenant. It's derived from the request host on a
  storefront, or the admin's JWT on the dashboard, on the server, and signed.

The result is that tenant isolation is a property of the database. It holds for core
Medusa code, third-party modules, background jobs, and code that hasn't been written
yet.

## How a request flows

```
Buyer opens  seller-a.com
   |
   v
Next.js storefront (apps/storefront) reads the Host on the server,
   |   signs it (HMAC-SHA256), and calls Medusa /selfkart/resolve-domain
   v
tenant_domains registry maps host -> tenant_id + publishable_key
   |   unknown / draft / suspended host -> safe status page, no tenant data
   v
storefront calls the Medusa Store API with a signed tenant id + publishable key
   |   the browser carries no tenant context; proxy.ts strips inbound x-selfkart-*
   v
Medusa middleware derives the tenant context from the trusted signed source
   |
   v
the DB connection opens a transaction and runs:
        SET LOCAL app.current_tenant = '<tenant_uuid>';
   |
   v
Medusa services and workflows run their queries inside that transaction
   |
   v
Postgres RLS filters products, carts, orders, customers, prices, payments
   |
   v
R2 media is read and written under a tenant-prefixed object key
```

The same machinery scopes the seller admin. Each seller logs into the same Medusa Admin
at `/app`, their JWT carries the tenant id, the `/admin*` middleware sets
`app.current_tenant`, and RLS makes the one shared dashboard show only their products,
orders, customers, and admin users.

## Why this is hard

RLS with `SET LOCAL` is textbook. Making a real framework honor it under a
transaction-pooled connection (Neon and PgBouncer) is where the work was.

### 1. The read-path gap, the one that nearly killed it

Medusa's writes run inside transactions (seeds, workflows), so `SET LOCAL` worked and
the database gate passed. But Medusa's reads (`query.graph`, MikroORM `@InjectManager`
finds) run without a transaction, so the tenant hook never fired and RLS failed closed
to zero rows. A logged-in seller saw an empty store. Safe, but unusable.

The fix is a `pnpm patch` on `@mikro-orm/knex` that wraps tenant-scoped reads in a
transaction so the `SET LOCAL` hook fires on reads too, plus an
`assertTenantReadPathPatchApplied()` startup guard so a future dependency bump can't
silently revert it. Tenant context now holds on reads and writes.

### 2. Transaction-local, because the pooler demands it

Neon's pooled URL is transaction-oriented (PgBouncer). A session-level `SET` would
bleed across pooled clients. Everything uses `SET LOCAL` inside the same transaction as
the query, never a plain `SET`, and never a session `RESET` as a safety net.

### 3. Machine-generated link tables

Medusa creates link tables (`product_sales_channel`, `order_cart`,
`product_variant_price_set`, and more) after the module migrations run. A
post-migration step in `src/migration-scripts/` enables and forces RLS on them with
join-derived policies, inferring ownership from the tenant-scoped side rather than
duplicating a `tenant_id` column.

### 4. Global unique constraints versus multi-tenant reality

Upstream uniqueness like `product.handle`, `variant.sku`, `fulfillment_set.name`,
`service_zone.name`, and `tax_region (country, province)` is global, so two sellers
couldn't both have a "shoes" handle or configure the same country. Those are replaced
with tenant-aware unique indexes. Module migrations can recreate the global ones, so a
follow-up migration re-asserts the tenant-aware indexes after module sync.

### 5. Shared versus scoped: not everything is tenant data

`region` and `region_country` are deliberately platform-shared and not RLS'd, because
Medusa enforces one country per region and per-tenant regions sharing a country would
collide. The currency and country container isn't seller data; the sensitive data
inside it (prices, shipping rates, payments, fulfillments, orders) is tenant-scoped.
Same posture for `payment_provider`, `shipping_profile`, and similar. Classifying every
table as tenant-scoped, shared-reference, or platform-only is the core security
exercise.

### 6. Platform tables sit outside the tenant model

`tenants`, `tenant_domains`, `platform_admins`, and `seller_applications` are non-RLS
by design. They're read before any tenant context exists (during host resolution) and
owned by the migrator role. The cross-tenant operator console needs no RLS bypass,
because platform state lives outside the per-tenant world.

Four small `pnpm` patches carry the whole transaction-context guarantee: the
`@medusajs/utils` connection, the `@mikro-orm/knex` read path, pricing, and inventory.
Each is verified at startup and in the test suite. A wrong patch hunk-header once made
`pnpm install` silently skip a patch, because GNU `patch` had masked it, so the suite
now asserts patches are actually applied in `node_modules`, not just present.

## Repository layout

```
selfkart.com/
├── apps/
│   ├── medusa/         Medusa 2.15.5 backend: modules, migrations, RLS, workflows, RLS test suite
│   ├── storefront/     Next.js 16 buyer storefront: Host-to-tenant resolver, cart to checkout to order
│   └── superadmin/     Next.js 16 platform operator console: apply, approve, provision
├── docs/
│   └── seller-onboarding.md     operator runbook
└── phase0-rls-smoke/            standalone DB-only RLS gate (run.sh)
```

Three standalone pnpm apps, no workspace root.

## Tech stack

- Backend: Medusa v2.15.5, pinned exactly. Every upgrade re-audits the tables.
- Database: Neon Postgres 17. Serverless, with branches for disposable test databases.
- Isolation: Postgres RLS with `SET LOCAL`, enforced by the database rather than
  hand-written filters.
- Storefront: Next.js 16.2.9. Host-derived tenancy; Server Actions keep the context on
  the server.
- Operator console: Next.js 16 with Tailwind v4, the apply-approve-provision flow, on
  port 3100.
- Media: Cloudflare R2, with tenant-prefixed object keys.
- Payments: Razorpay, per tenant. Encrypted per-tenant credentials, so money lands in
  the seller's own account.
- Shipping: Shiprocket, per tenant, with its own credentials and webhooks.
- Package manager: pnpm via Corepack, pinned in `packageManager`, carrying the RLS
  patches.

### Two database roles

`neondb_owner` is used for migrations only, on the direct (non-pooled) URL, and has
`BYPASSRLS`. `medusa_app` is used by the running app, on the pooled URL (`-pooler`,
`pgbouncer=true`); it has `LOGIN`, no `BYPASSRLS`, and owns nothing.

All validation runs on disposable Neon branches: create, migrate as `neondb_owner`,
test as pooled `medusa_app`, delete.

## Security model

1. Postgres RLS is the isolation boundary.
2. The runtime connects as `medusa_app`, never `neondb_owner`.
3. `medusa_app` never owns tenant tables and never has `BYPASSRLS`.
4. Tenant context is `SET LOCAL app.current_tenant`, inside the same transaction as the
   query.
5. The tenant id is derived on the server from the domain or session, never from a
   browser header. `proxy.ts` strips inbound `x-selfkart-*`, and storefront mutations
   run through Next.js Server Actions so the signed headers are attached on the server.
6. Production refuses to boot with a default or unset `JWT_SECRET`, `COOKIE_SECRET`, or
   `SELFKART_STOREFRONT_SECRET`, and disables the test tenant header.
7. Every Medusa upgrade triggers a full table audit and the RLS isolation suite.

The isolation suite, run as pooled `medusa_app`, covers products, carts, customers,
orders, the admin `user` and `invite` tables, the read path, checkout pricing, payment
and fulfillment tables, `api_key`, tax tables, notifications, background jobs, and a
500-probe concurrency run through the pooler. It is currently green.

## Status

This is a working pilot, built and validated iteratively. Done and validated on live
Neon branches:

- DB-only RLS gate (500 iterations, concurrency 50)
- Medusa shared-RLS gate (commerce tables and link tables)
- Seller admin to tenant binding: each seller sees only their own data in `/app`
- Storefront Host-to-tenant resolver, HMAC-signed and forge-resistant
- Buyer cart to checkout to order, RLS-scoped, proven end-to-end for two tenants
- `api_key`, tax tables, inventory, stock, sales channels, and notifications isolated
- Four markets (India, US, UAE, Europe) with per-tenant currency resolution
- Self-healing CSV catalog import (inventory, shipping profile, store-currency price)
- Platform superadmin console: apply, approve, provision, delete a seller
- Per-tenant encrypted Razorpay credential management (checkout wiring in progress)

In progress and next: Razorpay payment-session and webhook reconciliation, a real R2
upload smoke test, Shiprocket per-tenant shipments, and fuller self-serve onboarding
(template and brand choice, custom-domain TLS).

## Quickstart

The operator runbook for onboarding a seller is in `docs/seller-onboarding.md`.

```sh
# 1. Backend: install (applies the RLS pnpm patches), configure, migrate
cd apps/medusa
corepack pnpm install
cp .env.example .env        # fill in the two Neon URLs + secrets

#   migrations run as the OWNER on the DIRECT url
DATABASE_URL="$MIGRATOR_DATABASE_URL" corepack pnpm db:migrate

# 2. Create two sellers (different tenant IDs)
SELLER_ADMIN_TENANT_ID=00000000-0000-0000-0000-00000000000a \
  SELLER_ADMIN_EMAIL=owner@acme-store.com SELLER_ADMIN_PASSWORD='MySecret123!' \
  corepack pnpm exec medusa exec ./src/scripts/create-seller-admin.ts

# 3. Run the backend (as medusa_app, pooled) and open /app
corepack pnpm dev            # http://localhost:9000/app

# 4. Prove isolation (pooled medusa_app role, must be all-green)
APP_DATABASE_URL="$DATABASE_URL" corepack pnpm test:rls
```

`.env` essentials:

```env
MIGRATOR_DATABASE_URL=postgresql://neondb_owner:...@<host>.neon.tech/neondb?sslmode=require
APP_DATABASE_URL=postgresql://medusa_app:...@<host>-pooler.<region>.neon.tech/neondb?sslmode=require&pgbouncer=true
DATABASE_URL=${APP_DATABASE_URL}
JWT_SECRET=<32+ random chars>
COOKIE_SECRET=<32+ random chars>
SELFKART_STOREFRONT_SECRET=<32+ random chars>   # shared with the storefront; signs Host-to-tenant
```

Then bring up the storefront in `apps/storefront`, and optionally the operator console
in `apps/superadmin`.

## License

No license file yet. Add one before relying on this in production.

Built by Sai Krishna Sunkari and Swati Parge.
