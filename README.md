# Selfkart — Multi-Tenant E-commerce SaaS on Medusa + Neon Postgres RLS

> **One Medusa backend, one Next.js storefront, one Neon Postgres database — safely serving many independent sellers.**
> Tenant isolation is enforced at the database layer with PostgreSQL Row-Level Security (RLS), not in application code you have to remember to write.

Selfkart (the engine behind [MySelfKart](https://myselfkart.com)) gives small sellers their **own branded online store** — their domain, their customers, their Razorpay, **0% commission** — while we run a single shared platform. The interesting part, and the reason this repo exists, is **how one database serves every seller without a single row ever leaking across tenants.**

This README is the technical tour. If you're here to *run* it, jump to [Quickstart](#quickstart).

---

## The problem

Most "store builder" SaaS products pick one of two painful options:

1. **One database (or schema) per seller.** Strong isolation, but operationally brutal — N migrations, N connection pools, N backups, N upgrades. It does not scale to hundreds of long-tail sellers.
2. **One shared database, isolation enforced in app code.** Cheap to run, but *every* query in *every* service must remember `WHERE tenant_id = ?`. One forgotten filter — in core code, a third-party module, a background job, an admin widget — is a cross-tenant data leak.

Medusa v2 is a large framework with dozens of modules and machine-generated link tables. Auditing every query path by hand is not realistic. So we pushed the boundary **down into Postgres**.

## The big idea

```
Tenant identity is derived server-side → set as a transaction-local Postgres
variable → enforced by RLS policies on every tenant-owned table.

If tenant context is missing, queries return ZERO rows. The system fails closed.
```

- The **runtime database role (`medusa_app`)** has `LOGIN` but **not** `BYPASSRLS`, and **does not own** the tenant tables. It physically *cannot* see across tenants — even a buggy query can't.
- Every tenant-scoped table has RLS **enabled and FORCED**, with `USING` + `WITH CHECK` policies keyed on `current_setting('app.current_tenant', true)`.
- A `BEFORE INSERT OR UPDATE` trigger stamps `tenant_id` from the transaction context, so application code never has to pass it.
- The browser **never** asserts a tenant. It's derived from the request Host (storefront) or the admin's JWT (seller dashboard), server-side, and signed.

The result: tenant isolation is a property of the **database**, true for core Medusa code, third-party modules, background jobs, and code we haven't written yet.

---

## How a request flows

```
Buyer opens  seller-a.com
   │
   ▼
Next.js storefront (apps/storefront) reads the Host server-side
   │   signs it (HMAC-SHA256) and calls Medusa /selfkart/resolve-domain
   ▼
tenant_domains registry maps host → tenant_id + publishable_key
   │   unknown / draft / suspended host → safe status page (no tenant data)
   ▼
storefront calls Medusa Store API with signed x-selfkart-tenant-id + publishable key
   │   (browser never carries tenant context; proxy.ts strips inbound x-selfkart-*)
   ▼
Medusa middleware derives tenant context from the trusted signed source
   │
   ▼
DB connection patch opens a transaction and runs:
        SET LOCAL app.current_tenant = '<tenant_uuid>';
   │
   ▼
Medusa services / workflows run their queries inside that transaction
   │
   ▼
Postgres RLS filters products / carts / orders / customers / prices / payments …
   │
   ▼
R2 media is read/written under a tenant-prefixed object key
```

The same machinery scopes the **seller admin**: each seller logs into the *same* Medusa Admin at `/app`; their JWT carries `app_metadata.tenant_id`, the `/admin*` middleware sets `app.current_tenant`, and RLS makes the one shared dashboard show only their products, orders, customers and admin users.

---

## Why this is hard (the parts worth blogging about)

Postgres RLS + `SET LOCAL` is textbook. Making a **real framework** honor it under a **transaction-pooled** connection (Neon/PgBouncer) is where the work was. Highlights:

### 1. The read-path gap (the one that nearly killed it)
Medusa **writes** run inside transactions (seeds/workflows), so `SET LOCAL` worked and the DB-level gate passed. But Medusa **reads** (`query.graph`, MikroORM `@InjectManager` finds) run **without** a transaction — so the tenant hook never fired and RLS fail-closed to **zero rows**. A logged-in seller saw an empty store. *Safe, but unusable.*
**Fix:** a `pnpm patch` on `@mikro-orm/knex` wraps tenant-scoped reads in a transaction so the `SET LOCAL` hook fires on reads too — plus an `assertTenantReadPathPatchApplied()` startup guard so a future dependency bump can't silently revert it. Tenant context now holds on **reads and writes**.

### 2. Transaction-local, because the pooler demands it
Neon's pooled URL is **transaction-oriented** (PgBouncer). Session-level `SET` would bleed across pooled clients. Everything uses `SET LOCAL` inside the same transaction as the query — never plain `SET`, never session `RESET` as the safety net.

### 3. Machine-generated link tables
Medusa creates link tables (`product_sales_channel`, `order_cart`, `product_variant_price_set`, …) *after* module migrations. A post-migration step (`src/migration-scripts/*`) enables/forces RLS on them with **join-derived** policies (ownership inferred from the tenant-scoped side) rather than duplicating a `tenant_id` column.

### 4. Global unique constraints vs. multi-tenant reality
Upstream uniqueness like `product.handle`, `variant.sku`, `fulfillment_set.name`, `service_zone.name`, `tax_region (country, province)` is **global** — so two sellers couldn't both have a "shoes" handle or configure the same country. We replaced these with **tenant-aware** unique indexes. (Module migrations can *recreate* the global ones, so a follow-up migration **re-asserts** the tenant-aware indexes after module sync.)

### 5. Shared vs. scoped: not everything is tenant data
`region` / `region_country` are deliberately **platform-shared, not RLS'd** — Medusa enforces one-country-per-region, so per-tenant regions sharing a country would collide. The currency/country *container* isn't seller data; the **sensitive** data inside it (prices, shipping rates, payments, fulfillments, orders) **is** tenant-scoped. Same posture for `payment_provider`, `shipping_profile`, etc. Classifying every table as `tenant-scoped` / `shared-reference` / `platform-only` is the core security exercise.

### 6. The platform tables sit *outside* the tenant model
`tenants`, `tenant_domains`, `platform_admins`, `seller_applications` are **non-RLS** by design — they're read *before* any tenant context exists (host resolution) and owned by the migrator role. The cross-tenant operator console needs **no RLS bypass** because platform state lives outside the per-tenant world.

> Four small, asserted `pnpm` patches carry the whole transaction-context guarantee (`@medusajs/utils` connection, `@mikro-orm/knex` read path, pricing, inventory). Each is verified at startup and in the test suite. A wrong patch hunk-header once made `pnpm install` *silently* skip a patch (GNU `patch` had masked it) — so the suite asserts patches are actually applied in `node_modules`, never just "present."

---

## Repository layout

```
selfkart.com/
├── apps/
│   ├── medusa/         # Medusa 2.15.5 backend — modules, migrations, RLS, workflows, RLS test suite
│   ├── storefront/     # Next.js 16 buyer storefront — Host→tenant resolver, cart→checkout→order
│   └── superadmin/     # Next.js 16 platform operator console (apply → approve → provision)
├── docs/
│   └── seller-onboarding.md     # operator runbook
└── phase0-rls-smoke/            # standalone DB-only RLS gate (run.sh)
```

Three standalone pnpm apps (no workspace root).

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | **Medusa v2.15.5** (pinned, exact) | Modular commerce engine; every upgrade re-audits tables |
| Database | **Neon Postgres 17** | Serverless Postgres with branches → disposable test DBs |
| Isolation | **Postgres RLS + `SET LOCAL`** | Isolation enforced by the DB, not by hand-written filters |
| Storefront | **Next.js 16.2.9** | Host-derived tenancy; Server Actions keep tenant context server-side |
| Operator console | **Next.js 16 + Tailwind v4** | Apply → approve → provision flow on port 3100 |
| Media | **Cloudflare R2** | Tenant-prefixed object keys |
| Payments | **Razorpay, per tenant** | Encrypted per-tenant credentials; money lands in the seller's own account |
| Shipping | **Shiprocket, per tenant** | Per-tenant credentials and webhooks |
| Package manager | **pnpm via Corepack** | Pinned `packageManager`; carries the RLS patches |

### Two database roles (non-negotiable)

| Role | Use | Connection | Flags |
|---|---|---|---|
| `neondb_owner` | **migrations only** | direct (non-pooled) URL | `BYPASSRLS=true` |
| `medusa_app` | **the running app** | pooled URL (`-pooler`, `pgbouncer=true`) | `LOGIN`, **no** `BYPASSRLS`, **owns nothing** |

All validation runs on **disposable Neon branches**: create → migrate as `neondb_owner` → test as pooled `medusa_app` → delete.

---

## Security model — the non-negotiables

1. Postgres RLS is *the* isolation boundary.
2. Runtime connects as `medusa_app` — never `neondb_owner`.
3. `medusa_app` never owns tenant tables and never has `BYPASSRLS`.
4. Tenant context is `SET LOCAL app.current_tenant`, inside the same transaction as the query.
5. Tenant id is derived **server-side** from domain/session — never from a browser header. (`proxy.ts` strips inbound `x-selfkart-*`; storefront mutations run through Next.js Server Actions so signed headers are attached server-side.)
6. Production **refuses to boot** with default/unset `JWT_SECRET`, `COOKIE_SECRET`, or `SELFKART_STOREFRONT_SECRET`, and disables the test tenant header.
7. Every Medusa upgrade → full table audit + the RLS isolation suite.

The isolation suite (pooled `medusa_app`) covers products, carts, customers, orders, the admin `user`/`invite` tables, the read path, checkout pricing/payment/fulfillment tables, `api_key`, tax tables, notifications, background jobs, and 500-probe concurrency through the pooler — currently **green**.

---

## Status

This is a **working pilot**, built and validated iteratively. Done and validated on live Neon branches:

- ✅ DB-only RLS gate (500 iterations / concurrency 50)
- ✅ Medusa shared-RLS gate (commerce tables + link tables)
- ✅ Seller admin ↔ tenant binding — each seller sees only their own data in `/app`
- ✅ Storefront Host→tenant resolver (HMAC-signed, forge-resistant)
- ✅ Buyer **cart → checkout → order**, RLS-scoped, proven end-to-end for two tenants
- ✅ `api_key`, tax tables, inventory/stock/sales channels, notifications isolated
- ✅ Four markets (India / US / UAE / Europe), per-tenant currency resolution
- ✅ Self-healing CSV catalog import (inventory, shipping profile, store-currency price)
- ✅ Platform superadmin console — apply → approve → provision → delete seller
- ✅ Per-tenant encrypted Razorpay credential management (checkout wiring in progress)

**In progress / next:** Razorpay payment-session + webhook reconciliation, a real R2 upload smoke test, Shiprocket per-tenant shipments, and fuller self-serve onboarding (template/brand choice, custom-domain TLS).

---

## Quickstart

> Operator runbook for onboarding a seller: **[docs/seller-onboarding.md](./docs/seller-onboarding.md)**.

```sh
# 1. Backend — install (applies the RLS pnpm patches), configure, migrate
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

# 4. Prove isolation — pooled medusa_app role, must be all-green
APP_DATABASE_URL="$DATABASE_URL" corepack pnpm test:rls
```

`.env` essentials:

```env
MIGRATOR_DATABASE_URL=postgresql://neondb_owner:...@<host>.neon.tech/neondb?sslmode=require
APP_DATABASE_URL=postgresql://medusa_app:...@<host>-pooler.<region>.neon.tech/neondb?sslmode=require&pgbouncer=true
DATABASE_URL=${APP_DATABASE_URL}
JWT_SECRET=<32+ random chars>
COOKIE_SECRET=<32+ random chars>
SELFKART_STOREFRONT_SECRET=<32+ random chars>   # shared with the storefront; signs Host→tenant
```

Then bring up the storefront (`apps/storefront`) and, optionally, the operator console (`apps/superadmin`).

---

## License

No license file yet — add one before relying on this in production. If you're reading this from a blog post: hi 👋 — questions welcome.

Built by [Sai Krishna Sunkari](https://x.com/Saisunkari19) and Swati Parge.
