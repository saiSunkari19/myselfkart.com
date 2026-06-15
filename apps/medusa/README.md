# Selfkart Medusa Backend — Multi-Tenant (Neon RLS)

This Medusa `2.15.5` backend runs **multiple sellers on one database**, isolated by
PostgreSQL Row-Level Security (RLS) on Neon. Every seller logs into the **same**
Medusa Admin dashboard at `/app`; what makes it "their" store is the tenant
context derived from their login — RLS then filters all data to their tenant.

> Status: the **seller-facing admin** (products, catalogue, orders, customers) is
> fully tenant-isolated and working. The **buyer-facing storefront** and
> domain-based routing (`/store*`) are not built yet (Phase 1 main task), so the
> end-to-end *buyer* checkout flow is not wired here yet. See
> `../../docs/superpowers/plans/` for the plan and design docs.

---

## 1. How tenancy works (read this first)

- Each seller is a **tenant**, identified by a UUID (e.g.
  `00000000-0000-0000-0000-00000000000a`).
- A seller **admin user** is bound to one tenant. The binding lives in both
  `user.tenant_id` and the login credential's `auth_identity.app_metadata.tenant_id`.
- On login, the admin JWT carries `app_metadata.tenant_id`. The `/admin*`
  middleware reads it and sets the Postgres session var `app.current_tenant`;
  RLS policies filter every table (products, orders, customers, the admin user
  list, …) to that tenant.
- There is **no separate dashboard per seller** — it is the same `/app`, scoped
  by who is logged in.

Two roles are used against Neon:

| Role | Use | Connection |
|------|-----|------------|
| `neondb_owner` | migrations only | direct (non-pooled) URL |
| `medusa_app` | the running app | pooled URL (`-pooler`, `pgbouncer=true`) |

---

## 2. One-time setup

```sh
cd apps/medusa
corepack pnpm install            # applies the pnpm patches (tenant RLS hooks)
cp .env.example .env             # then fill in the two Neon URLs + secrets
```

`.env` needs (see `.env.example`):

```env
# migrations run as the owner on the DIRECT (non-pooled) URL
MIGRATOR_DATABASE_URL=postgresql://neondb_owner:...@<host>.neon.tech/neondb?sslmode=require
# the app runs as medusa_app on the POOLED URL
APP_DATABASE_URL=postgresql://medusa_app:...@<host>-pooler.<region>.neon.tech/neondb?sslmode=require&pgbouncer=true
DATABASE_URL=${APP_DATABASE_URL}
JWT_SECRET=<32+ chars>
COOKIE_SECRET=<32+ chars>
```

Run the migrations once with the **owner** URL:

```sh
DATABASE_URL="$MIGRATOR_DATABASE_URL" corepack pnpm db:migrate
```

---

## 3. Create multiple sellers

Each seller needs (a) a tenant UUID and (b) an admin account bound to it. Use the
`create-seller-admin` script — it creates the Medusa user, registers the
email/password credential, and stamps the tenant on both the user row and the
auth identity. Run it once per seller (against the **pooled** `medusa_app` URL):

```sh
# Seller A
SELLER_ADMIN_TENANT_ID=00000000-0000-0000-0000-00000000000a \
SELLER_ADMIN_EMAIL=owner@acme-store.com \
SELLER_ADMIN_PASSWORD='change-me-strong' \
DATABASE_URL="$APP_DATABASE_URL" \
corepack pnpm exec medusa exec ./src/scripts/create-seller-admin.ts

# Seller B
SELLER_ADMIN_TENANT_ID=00000000-0000-0000-0000-00000000000b \
SELLER_ADMIN_EMAIL=owner@globex-store.com \
SELLER_ADMIN_PASSWORD='change-me-strong' \
DATABASE_URL="$APP_DATABASE_URL" \
corepack pnpm exec medusa exec ./src/scripts/create-seller-admin.ts
```

Notes:
- `SELLER_ADMIN_TENANT_ID` must be a valid UUID. Pick a fresh UUID per seller
  (`uuidgen`). A managed tenant registry that allocates these is Phase 2; for now
  you choose them.
- `SELLER_ADMIN_PASSWORD` must be at least 8 characters.
- The script is idempotent per (tenant, email): re-running reuses the existing
  user/credential.
- **Pilot limitation:** an email can only back one admin login globally
  (`auth_identity` is globally unique on `(provider, email)`), so use a distinct
  email per seller.

To add a 3rd, 4th, … seller, repeat with a new tenant UUID and email.

---

## 4. Start the server and log in as each seller

```sh
DATABASE_URL="$APP_DATABASE_URL" corepack pnpm dev    # medusa develop
```

Open the admin dashboard:

```
http://localhost:9000/app
```

- Log in as **Seller A** (`owner@acme-store.com`). You see only Seller A's
  products, orders, customers, and (under Settings → Users) only Seller A's admin
  users.
- Log out, log in as **Seller B** (`owner@globex-store.com`). You see only
  Seller B's data. Neither seller can see the other's anything.

---

## 5. The per-seller e-commerce flow (admin side)

Logged in as a seller, everything you create is automatically tagged to that
seller's tenant — you do nothing special:

1. **Products** → create products, variants, prices.
2. **Catalogue** → Categories, Collections, Tags, Types to organise the catalogue.
3. **Customers** → create/inspect customers (each seller's customer list is separate).
4. **Orders / Draft Orders** → create draft orders, manage fulfilment and payments.
5. **Settings** → Sales Channels, Regions, etc. (scoped per seller where applicable).

Because of RLS, a product created by Seller A is invisible to Seller B even if
they share the same product handle or SKU (handles/SKUs are unique **per tenant**,
not globally).

### Buyer storefront (not yet wired)

The buyer-facing storefront and `/store*` domain routing are the next Phase 1
task. Until then, treat this backend as the **seller operations console**. When
the storefront lands, each seller's domain will resolve to their tenant and the
buyer browse → cart → checkout → order flow will be RLS-scoped the same way.

---

## 6. Verify isolation (optional)

Run the RLS integration suite against a **migrated** branch through the pooled
role (it seeds fixtures, creates two seller admins, and asserts no cross-tenant
leakage on products, carts, customers, orders, the admin user table, the read
path, and under concurrency):

```sh
APP_DATABASE_URL="$APP_DATABASE_URL" ITERATIONS=500 CONCURRENCY=50 \
  corepack pnpm test:rls
```

Expected: all tests pass. The suite also fails closed if the app role is
`neondb_owner` or has `BYPASSRLS`.

---

## 7. Troubleshooting

- **"Valid tenant context is required" (403) on `/admin*`** — the logged-in admin
  has no `tenant_id` in its auth identity. Re-run `create-seller-admin` for that
  account.
- **A seller sees zero products/data** — the tenant RLS read-path patch may not be
  applied. `corepack pnpm install` re-applies `patches/@mikro-orm__knex@...patch`;
  the server refuses to boot if the patch is missing (startup guard).
- **`app.current_tenant is required ...` during a script** — that script writes a
  tenant-scoped table without a tenant context. Wrap the work in
  `runWithTenantContext(...)` (see `src/scripts/create-seller-admin.ts`).
