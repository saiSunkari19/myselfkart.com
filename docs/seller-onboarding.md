# Seller Onboarding Checklist (Selfkart multi-tenant)

> One Medusa backend + one Next.js storefront + one Neon Postgres serve every
> seller, isolated by Postgres RLS. This is the **operator runbook** for adding a
> seller end to end. Follow the steps **in order** — several steps depend on the
> previous one (e.g. provisioning needs the sales channel, which needs products).
>
> Verified end to end on a disposable Neon branch (2026-06-16): two sellers
> provisioned from scratch, both complete priced orders, cross-tenant reads 404,
> RLS suite 12/12. See `Medusa neon rls multitenant implementation plan · MD.md`.

All commands run from `apps/medusa` unless noted. Use `corepack pnpm` so the
pinned package manager + the RLS patches are applied.

---

## 0. Platform one-time setup (once per environment, NOT per seller)

- [ ] **`.env` has both Neon URLs + real secrets** (see `apps/medusa/.env.example`):
  - `MIGRATOR_DATABASE_URL` — **direct** (non-pooled) URL, role `neondb_owner` (migrations only).
  - `APP_DATABASE_URL` / `DATABASE_URL` — **pooled** URL (`-pooler`, `pgbouncer=true`), role `medusa_app`.
  - `JWT_SECRET`, `COOKIE_SECRET` — 32+ random chars (prod **refuses to boot** on default/empty).
  - `SELFKART_STOREFRONT_SECRET` — 32+ random chars; the storefront signs `/store*`
    requests with it and Medusa verifies. **Must be identical** in
    `apps/storefront/.env`. Prod **refuses to boot** on the default value.
- [ ] **Dependencies installed with patches applied:** `corepack pnpm install`,
  then confirm the four patches loaded:
  ```sh
  for p in inventory pricing utils; do \
    grep -lq selfkart node_modules/@medusajs/$p/dist/**/*.js && echo "$p patch OK"; done
  ```
  (If `pnpm install` ever errors with `ERR_PNPM_INVALID_PATCH … hunk header`, a
  patch file's `@@ -a,b +c,d @@` line counts are wrong — fix them; GNU `patch
  --dry-run` will not catch this.)
- [ ] **Migrations applied** (as the migrator/owner role):
  ```sh
  DATABASE_URL="$MIGRATOR_DATABASE_URL" corepack pnpm db:migrate
  ```
- [ ] **A base Store exists** (Medusa creates one on first boot/migration).
  `provision:commerce` aborts with *"No store found"* if not — boot the server
  once (`DATABASE_URL="$APP_DATABASE_URL" corepack pnpm dev`) before provisioning.
- [ ] **Storefront env set:** `apps/storefront/.env` has `MEDUSA_BACKEND_URL` and
  the **same** `SELFKART_STOREFRONT_SECRET`.

---

## 1. Per-seller onboarding (repeat for each seller)

> **Console path (preferred):** the platform console (`apps/superadmin`) now
> automates the per-seller steps below. A seller submits the public
> `/apply` form → an operator clicks **Approve** in the console, which runs the
> `provisionSellerFromApplication` orchestrator (= steps 1, 3, 4, 5 here:
> create-seller-admin → seed-inventory-resources → provision:commerce →
> provision:storefront) and returns the seller's one-time admin credential. The
> seller then logs in at `/app` and imports their catalog (step 2). The CLI steps
> below remain the source of truth and the dev/recovery path.
>
> One-time setup for the console:
> ```sh
> # 1. apply the platform tables (runs with the other migration-scripts)
> DATABASE_URL="$MIGRATOR_DATABASE_URL" corepack pnpm db:migrate
> # 2. create the first operator login
> PLATFORM_ADMIN_EMAIL=ops@selfkart.com PLATFORM_ADMIN_PASSWORD='change-me-please' \
>   PLATFORM_ADMIN_ROLE=owner DATABASE_URL="$APP_DATABASE_URL" \
>   corepack pnpm create:platform-admin
> # 3. run the console (apps/superadmin/.env: MEDUSA_BACKEND_URL + SELFKART_STOREFRONT_BASE_DOMAIN)
> corepack pnpm --dir ../superadmin dev   # http://localhost:3100
> ```
> Verify the platform flow: `DATABASE_URL=... corepack pnpm exec medusa exec ./src/scripts/assert-platform-admin-flow.ts`.

> Conventions below use Seller A: tenant `00000000-0000-0000-0000-00000000000a`,
> host `seller-a.localhost`. Use a fresh UUID (`uuidgen`) and a real domain per seller.

### Step 1 — Allocate a tenant id + admin account
A seller = one tenant UUID + one admin login bound to it.
```sh
SELLER_ADMIN_TENANT_ID=<tenant-uuid> \
SELLER_ADMIN_EMAIL=owner@acme-store.com \
SELLER_ADMIN_PASSWORD='Strong-Pass-123' \
DATABASE_URL="$APP_DATABASE_URL" \
corepack pnpm exec medusa exec ./src/scripts/create-seller-admin.ts
```
- Idempotent per (tenant, email). One email backs one login globally — use a
  distinct email per seller.

### Step 2 — Import the seller's catalog
Preferred: the in-admin page `http://localhost:9000/app/seller-import` (parses the
seller CSV, creates tenant-scoped taxonomy, runs Medusa's importer, links taxonomy,
creates starter inventory). Script equivalent for dev/recovery:
```sh
SELLER_ADMIN_TENANT_ID=<tenant-uuid> \
SELLER_PRODUCT_CSV=../../outputs/<seller>.csv \
SELLER_PRODUCT_OUTPUT_CSV=../../outputs/<seller>-prepared.csv \
DATABASE_URL="$APP_DATABASE_URL" corepack pnpm prepare:seller-import
# upload the prepared CSV in Admin's native importer, then:
SELLER_ADMIN_TENANT_ID=<tenant-uuid> \
PRODUCT_TAXONOMY_CSV=../../outputs/<seller>-taxonomy.csv \
DATABASE_URL="$APP_DATABASE_URL" corepack pnpm link:seller-taxonomy
```
- [ ] **Products are published** (draft products never render on the storefront).

### Step 3 — Seed inventory resources (sales channel, stock location, stock)
Run **after** products exist; it links the seller's products to the channel and
sets stock. Re-run any time you import more products.
```sh
SELLER_ADMIN_TENANT_ID=<tenant-uuid> SELLER_NAME="Acme Clothing" STOCKED_QUANTITY=100 \
DATABASE_URL="$APP_DATABASE_URL" \
corepack pnpm exec medusa exec ./src/scripts/seed-tenant-inventory-resources.ts
```
Creates/reuses: the tenant sales channel (deterministic id), stock location,
channel↔location link, product↔channel links, and positive inventory levels.

### Step 4 — Provision the checkout pipeline (`provision:commerce`)
Sets up the shared region + per-tenant prices, shipping option, fulfillment, **and
links every product to the default shipping profile** (without this, checkout
fails with *"shipping profiles not satisfied"*).
```sh
TENANT_ID=<tenant-uuid> SELFKART_CURRENCY=usd SELFKART_COUNTRY=us \
  SELFKART_SHIPPING_AMOUNT=0 SELFKART_PROVISION_PRICE_AMOUNT=100 \
  DATABASE_URL="$APP_DATABASE_URL" corepack pnpm provision:commerce
```
- `SELFKART_PROVISION_PRICE_AMOUNT` is **bootstrap pricing only** (flat price on
  every variant) — **omit it** once the seller sets real prices via Admin/import.
- The region (currency+country) is intentionally **platform-shared**; prices,
  shipping rates, fulfillments and orders are tenant-scoped.

### Step 5 — Provision the storefront domain (`provision:storefront`)
Mints/reuses the seller's publishable key, writes the `tenant_domains` row, and
**self-heals** the key↔sales-channel link (so the key always points at *this*
tenant's channel).
```sh
TENANT_ID=<tenant-uuid> HOST=seller-a.localhost SELLER_NAME="Acme" TENANT_STATUS=active \
  DATABASE_URL="$APP_DATABASE_URL" corepack pnpm provision:storefront
```
- `TENANT_STATUS`: `active` renders the store; `draft` → coming-soon; `suspended` → unavailable.
- A `Repaired N cross-linked sales-channel link(s)` warning means it fixed a
  previously mis-linked key — expected when repairing older sellers.

### Step 6 — Route the domain to the storefront
- **Local:** add `seller-a.localhost` to `/etc/hosts` (→ `127.0.0.1`) or use a
  `*.localhost` resolver; the storefront derives the tenant from the `Host`.
- **Prod:** point the seller's domain (subdomain or custom) at the storefront
  deployment. No redeploy needed — routing is data-driven via `tenant_domains`.

### Step 7 — Verify the seller (per-seller smoke test)
- [ ] Admin: log in as the seller at `/app` → sees only their own products/orders/users.
- [ ] Storefront: open `http://seller-a.localhost:3000` → only their catalog, priced.
- [ ] Buy-through: add to cart → `/checkout` → email + shipping address (country in
  the region, e.g. `us`) → pick shipping → **Place order** → lands on `/order/<id>`.
- [ ] Cross-tenant: another seller's host never shows this seller's products/cart/order.

---

## 2. Repairing already-onboarded sellers

The provisioning scripts are **idempotent and self-healing** — to fix a seller
whose checkout breaks, just re-run, no manual SQL:
- Cross-linked publishable key / `POST /store/carts` 500 → re-run **`provision:storefront`**.
- Checkout fails *"shipping profiles not satisfied"* → re-run **`provision:commerce`**.
- Storefront shows zero products → products unpublished, or re-run **`seed-tenant-inventory-resources`** (links products to the channel).

---

## 3. Known gaps to watch (not yet automated)

- ~~**`api_key` is not tenant-scoped**~~ — **FIXED** (migration
  `20260616000500-protect-api-key`): `api_key` now uses the tenant-nullable RLS
  policy, so a seller sees only its own keys; the platform Default key stays null
  (platform-only). Verify with `corepack pnpm assert:api-key-isolation` on a Neon
  branch. Follow-up still open: the `publishable_api_key_sales_channel` link table
  is not yet scoped (low risk — the token lives on the now-isolated `api_key`).
- **Taxes** are not RLS'd (pilot runs `automatic_taxes=false`). Don't enable
  per-seller taxes until Phase 3.
- **R2 media** keys aren't tenant-prefixed yet.
- **Payments/shipping are "manual"** (`pp_system_default` / `manual_manual`) for the
  pilot — real Razorpay/Shiprocket per tenant are later phases.

See `Medusa neon rls multitenant implementation plan · MD.md` for the full status.
