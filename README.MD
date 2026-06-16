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