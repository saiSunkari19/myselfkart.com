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
truth. Current short list:

1. **Run the live Neon-branch E2E for buyer cart → checkout → order.** The code is
   implemented and compiles (`next build` + `tsc` green), but the dynamic flow is
   not yet proven against a live pooled `medusa_app` DB. On a disposable Neon
   branch: `db:migrate` as `neondb_owner` (picks up
   `20260616000300-protect-checkout-tables.ts`), `seed:tenants`,
   `seed-tenant-inventory-resources`, `provision:storefront` + `provision:commerce`
   for two tenants, then buy through both storefronts. Confirm cross-tenant
   cart/order/price isolation and a green `test:rls`.
   - **Watch item (MEDIUM):** the checkout tables now FORCE RLS. The flow only
     works if tenant context holds through every payment/fulfillment write and
     Medusa's price-calc reads. If a write escapes the request transaction, the
     row gets `tenant_id` NULL and is hidden from the tenant (functional break,
     not a leak — RLS fails closed). Validate end to end; fix context propagation
     if any step breaks.
2. **`api_key` tenant-nullable scoping** — sellers can still see each other's keys
   (Medusa's boot-time Default Publishable Key has no tenant). MEDIUM security gap.
3. **R2 media with tenant-prefixed object keys** — storefront already allows remote
   image hosts; uploads aren't tenant-prefixed yet.
4. **Phase 3 tax-table RLS** (`tax_region`/`tax_rate`/`tax_rate_rule`) before
   enabling tenant taxes (deferred — pilot uses `automatic_taxes=false`).
5. **Real coming-soon / suspended templates** + a tenant-status admin (routing
   already renders placeholder pages).