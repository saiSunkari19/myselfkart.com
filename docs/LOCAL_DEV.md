### How to test the seller dashboard
Prerequisites
Make sure your .env has both Neon URLs and real secrets (see apps/medusa/.env.example):


cd apps/medusa
export MIGRATOR_DATABASE_URL='postgresql://neondb_owner:...direct-host.../neondb?sslmode=require'

DATABASE_URL="$MIGRATOR_DATABASE_URL" corepack pnpm db:migrate


DATABASE_URL="$APP_DATABASE_URL" corepack pnpm dev






```
DATABASE_URL=postgresql://medusa_app:...@...-pooler...neon.tech/neondb?...&pgbouncer=true
MIGRATOR_DATABASE_URL=postgresql://neondb_owner:...@....neon.tech/neondb?sslmode=require
JWT_SECRET=<32+ random chars>
COOKIE_SECRET=<32+ random chars>
```

#### Step 1 — Run migrations

cd apps/medusa
DATABASE_URL="$MIGRATOR_DATABASE_URL" corepack pnpm db:migrate
Step 2 — Create two seller accounts

### Seller A
SELLER_ADMIN_TENANT_ID=00000000-0000-0000-0000-00000000000a \
SELLER_ADMIN_EMAIL=owner@acme-store.com \
SELLER_ADMIN_PASSWORD='MySecret123!' \
corepack pnpm exec medusa exec ./src/scripts/create-seller-admin.ts

#### Seller B
SELLER_ADMIN_TENANT_ID=00000000-0000-0000-0000-00000000000b \
SELLER_ADMIN_EMAIL=owner@globex-store.com \
SELLER_ADMIN_PASSWORD='MySecret123!' \
corepack pnpm exec medusa exec ./src/scripts/create-seller-admin.ts
Step 3 — Start the server

corepack pnpm dev
Step 4 — Open the dashboard
Go to http://localhost:9000/app

Login as Seller A (owner@acme-store.com) → create a product. It will only be visible under this login.

Logout → Login as Seller B (owner@globex-store.com) → create a different product. You will NOT see Seller A's product here.

Step 5 — Verify isolation with the RLS suite

APP_DATABASE_URL="$DATABASE_URL" corepack pnpm test:rls
All 7 tests should pass. This covers products, carts, customers, orders, the admin user table, the read path, and concurrency.


### Delete products from Seller 

```
# Dry Run 
TENANT_ID=<seller-tenant-uuid> corepack pnpm --dir apps/medusa delete:seller-products

# Confirmation 

TENANT_ID=<seller-tenant-uuid> CONFIRM_DELETE_SELLER_PRODUCTS=yes corepack pnpm --dir apps/medusa delete:seller-products

```


### Local Dev For both backend and storefront

```

Step 1 — Set one shared secret in both apps

The storefront signs requests; Medusa verifies them with the same secret.

Add this line to apps/medusa/.env:


SELFKART_STOREFRONT_SECRET=local-dev-storefront-secret-change-me-0123456789
Create apps/storefront/.env with the same value:


MEDUSA_BACKEND_URL=http://localhost:9000
SELFKART_STOREFRONT_SECRET=local-dev-storefront-secret-change-me-0123456789



Step 2 — Find your two sellers' tenant IDs
Each seller's storefront is keyed by its tenant UUID. To list them (uses the migrator role, which bypasses RLS):


cd apps/medusa && set -a && source .env && set +a
psql "$MIGRATOR_DATABASE_URL" -c \
  'select tenant_id, count(*) from "user" group by tenant_id;'


Step 3 — Provision a local domain for each seller
This mints a publishable key linked to the seller's sales channel and writes the tenant_domains row. Run once per seller (swap in each tenant ID):


cd apps/medusa
TENANT_ID=<seller-A-uuid> HOST=seller-a.localhost SELLER_NAME="Seller A" TENANT_STATUS=active \
  corepack pnpm provision:storefront

TENANT_ID=<seller-B-uuid> HOST=seller-b.localhost SELLER_NAME="Seller B" TENANT_STATUS=active \
  corepack pnpm provision:storefront
If you hit No tenant sales channel found, that seller has no sales channel yet — run SELLER_ADMIN_TENANT_ID=<uuid> SELLER_NAME="Seller A" corepack pnpm exec medusa exec ./src/scripts/seed-tenant-inventory-resources.ts first (it also links products to the channel). Products must be published and linked to the channel to appear.

```

Step 4 — Run the storefront

```
cd apps/storefront && corepack pnpm dev
```

Open `http://seller-a.localhost:3000` and `http://seller-b.localhost:3000` — each renders only its own tenant's catalog.


### Buyer cart → checkout → order (per seller)

The storefront supports the full transactional flow (cart → shipping → manual
payment → completed order), all RLS-scoped per tenant. To exercise it locally:

Step 1 — Provision the checkout pipeline for each seller. This ensures the shared
region (currency + manual payment provider), and — inside each tenant's context —
prices on the seller's variants, a `manual_manual` shipping option, and inventory.
Run once per seller (after `seed-tenant-inventory-resources`):

```
cd apps/medusa
# SELFKART_PROVISION_PRICE_AMOUNT sets a flat price (major units) on every
# variant — bootstrap pricing for testing; omit it once sellers set real prices.
TENANT_ID=<seller-A-uuid> SELFKART_CURRENCY=usd SELFKART_COUNTRY=us \
  SELFKART_SHIPPING_AMOUNT=0 SELFKART_PROVISION_PRICE_AMOUNT=100 \
  corepack pnpm provision:commerce

TENANT_ID=<seller-B-uuid> SELFKART_CURRENCY=usd SELFKART_COUNTRY=us \
  SELFKART_SHIPPING_AMOUNT=0 SELFKART_PROVISION_PRICE_AMOUNT=100 \
  corepack pnpm provision:commerce
```

Step 2 — On each seller's storefront: add a product to cart → `/cart` → `/checkout`
→ enter email + shipping address (use a country in the region, e.g. `us`) → pick
the shipping method → Place order → land on `/order/<id>`. A cart/order created on
Seller A's host is never visible on Seller B's (RLS + sales-channel scoping).

Step 3 — Verify isolation with the RLS suite (pooled `medusa_app` role):

```
APP_DATABASE_URL="$DATABASE_URL" corepack pnpm --dir apps/medusa test:rls
```

This now includes `checkout-isolation` (pricing/payment/fulfillment tables), on
top of products, carts, customers, orders, the admin user table, the read path,
and concurrency.


## Pending / TODO (for the next agent)

Start from the handoff at the top of
`Medusa neon rls multitenant implementation plan · MD.md` — it is the source of
truth. To onboard a seller, follow `docs/seller-onboarding.md`. Current short list:

1. ~~**Run the live Neon-branch E2E for buyer cart → checkout → order.**~~ **DONE
   2026-06-16 (commit 099afd1a9)** — buy-through proven on a disposable branch for
   two tenants, cross-tenant reads 404, `test:rls` 12/12. Fixed along the way: the
   inventory pnpm patch (bad hunk header → never applied), cross-linked publishable
   keys, and missing product↔shipping_profile links. See the plan's handoff +
   `docs/seller-onboarding.md`.
2. ~~**`api_key` tenant-nullable scoping**~~ **DONE 2026-06-16** — migration
   `20260616000500-protect-api-key` applies the tenant-nullable RLS policy to
   `api_key`; per-tenant keys are stamped + isolated, the boot-time Default key
   stays `tenant_id` null (platform-only). Verify:
   `DATABASE_URL="$APP_DATABASE_URL" corepack pnpm assert:api-key-isolation`.
   Follow-up (low risk): scope the `publishable_api_key_sales_channel` link table.
3. **R2 media with tenant-prefixed object keys** — storefront already allows remote
   image hosts; uploads aren't tenant-prefixed yet.
4. **Phase 3 tax-table RLS** (`tax_region`/`tax_rate`/`tax_rate_rule`) before
   enabling tenant taxes (deferred — pilot uses `automatic_taxes=false`).
5. **Real coming-soon / suspended templates** + a tenant-status admin (routing
   already renders placeholder pages).




## Super admin (platform console)

`apps/superadmin` is a separate Next.js console (port 3100) for **platform
operators**, not sellers. It turns the manual `docs/seller-onboarding.md` runbook
into a UI flow:

```
selfkart.com/apply (public form)  ->  seller_applications row (pending)
   ->  operator clicks Approve in the console
   ->  provisionSellerFromApplication() runs onboarding steps 1,3,4,5
       (create-seller-admin -> seed-inventory-resources -> provision:commerce
        -> provision:storefront), idempotent + self-healing
   ->  tenant goes active; operator gets the seller's one-time admin credential
   ->  seller logs in at /app and imports their catalog (step 2)
```

Surfaces: **Dashboard** (pending-application queue + tenant counts),
**Applications** (review / approve / reject, with retry on failed provisioning),
**Tenants** (every store + its domain + status), public **/apply** form.

Architecture: platform data (`platform_admins`, `platform_admin_sessions`,
`seller_applications`) lives in **non-RLS platform tables** (like
`tenants`/`tenant_domains`), so the cross-tenant operator needs no RLS bypass.
Routes live under `/selfkart/platform/*` (outside the tenant-jailed `/admin*`),
guarded by an opaque session (scrypt-hashed password, SHA-256-hashed bearer
token). The browser never calls Medusa directly — the console server forwards the
session as `x-platform-session`.

### Run it

```sh
cd apps/medusa
DATABASE_URL="$MIGRATOR_DATABASE_URL" corepack pnpm db:migrate          # creates platform tables
PLATFORM_ADMIN_EMAIL=ops@selfkart.com PLATFORM_ADMIN_PASSWORD='1234567890' PLATFORM_ADMIN_ROLE=owner \
  DATABASE_URL="$APP_DATABASE_URL" corepack pnpm create:platform-admin
cd ../superadmin && cp .env.example .env && corepack pnpm dev           # :3100
```

`apps/superadmin/.env`: `MEDUSA_BACKEND_URL` (server-side reachable Medusa) and
`SELFKART_STOREFRONT_BASE_DOMAIN` (for the /apply URL preview, e.g. `localhost`).

Verify the platform flow on a disposable Neon branch:
`DATABASE_URL="$APP_DATABASE_URL" corepack pnpm exec medusa exec ./src/scripts/assert-platform-admin-flow.ts`


