# Medusa + Neon RLS Multi-Tenant Ecommerce SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Use `context7-mcp` before writing Medusa, Next.js, Neon, or SDK-specific code. Use Neon MCP for database inspection and migrations where available.

**Prepared for:** Sai Krishna Sunkari  
**Updated:** 2026-06-16
**Goal:** Build a multi-tenant ecommerce SaaS where one Medusa backend, one Next.js storefront, and one Neon Postgres database safely serve many independent sellers.  
**Architecture:** Shared Medusa v2 backend plus Neon Postgres 17 RLS. Tenant context is derived server-side, set with `SET LOCAL app.current_tenant` inside the same transaction as tenant-scoped queries, and enforced by Postgres RLS.  
**Tech Stack:** Medusa `2.15.5`, Neon Postgres `17`, Next.js `16.2.9`, pnpm via Corepack, Cloudflare R2, Redis, Razorpay per tenant, Shiprocket per tenant.

---

## Implementation Progress / Handoff (updated 2026-06-17)

> **New agent: start here.** This is the running state of the work. Current branch:
> `feat/storefront-domain-resolver` (latest commit `9ec209f54`: multi-market
> provisioning + tenant teardown + self-healing imports; prior `5ee701f50`: platform
> superadmin console + api_key tenant-scoping; default branch is `main`). Neon project
> `selfkart` / `jolly-rice-01919313`, Postgres 17. All validation is done on
> disposable Neon branches (create → migrate as `neondb_owner` → test as
> `medusa_app` pooled → delete). Backend lives in `apps/medusa/`; see its
> `README.md` for how to run multiple sellers.

### DONE and validated

- **Multi-market provisioning + self-healing imports + tenant delete (2026-06-17,
  commit `9ec209f54`):**
  - **Four markets live** — India (INR/`in`), US (USD/`us`), UAE (AED/`ae`),
    Europe (EUR / Core EU 9: de,fr,it,es,nl,ie,be,at,pt). Authoritative
    `apps/medusa/src/platform/markets.ts` (currency → country set). Regions stay
    platform-shared **one per currency** (Medusa enforces one-country→one-region);
    `provision-tenant-commerce` now seeds the full country set per market on the
    region AND the shipping service-zone. `/apply` is a single **Market** selector
    (defaults to India).
  - **Per-tenant region resolution (the multi-region blocker):** added
    `tenants.currency`/`country` (migration `20260617000100`), stamped at provision
    time; `resolve-domain` returns `currency`; storefront `getRegion` now picks the
    region by the tenant's currency (was the ambiguous "first region with
    countries"). Existing tenants backfilled.
  - **Imports are sellable immediately.** Three "provisioning ran before the
    catalog existed" gaps are now healed at import time in
    `api/admin/selfkart/product-imports/complete`: (1) inventory levels, (2) link
    every product to the default shipping profile (the *"cart items require shipping
    profiles…"* error), (3) backfill a store-currency price on every variant (the
    blank-price symptom when a CSV lacks the store-currency column). Plus a
    `product-variant.created` workflow hook
    (`apps/medusa/src/workflows/hooks/ensure-variant-inventory.ts`) auto-stocks
    products hand-created in Admin. Reusable scripts:
    `backfill-tenant-currency-prices.ts`, and the catalog CSVs now carry
    `Variant Price INR/AED` columns.
  - **Fixed multi-tenant unique-name collisions:** `fulfillment_set.name` /
    `service_zone.name` have GLOBAL unique indexes — provisioning now namespaces
    them per tenant (only the first seller could provision before).
  - **Delete seller (superadmin):** `teardownTenant` (FK-ordered hard delete of all
    tenant data; refuses on real orders unless forced; preserves the shared region),
    `DELETE /selfkart/platform/tenants/[id]`, a typed-confirm Delete panel + a
    "Delete disabled" bulk action. Validated live (a throwaway seller torn down with
    zero leftovers/orphans). CLI equivalent: `scripts/teardown-tenant.ts`.
- **Phase 0A — DB RLS gate:** `phase0-rls-smoke/run.sh` passes at 500/conc-50.
- **Phase 0B — Medusa shared-RLS gate: PASSED (GO).** Versions frozen
  (Medusa 2.15.5 + Neon PG 17). Commerce tables (product/cart/customer/order +
  children + link tables) are tenant-RLS'd via `SET LOCAL app.current_tenant` +
  the `selfkart_set_tenant_id` trigger. Isolation suite under
  `apps/medusa/tests/integration/rls/` covers products, cart/customer/order,
  cross-tenant direct lookup, background jobs, concurrent pooler.
- **Read-path RLS fix (was the key gap):** Medusa reads (`query.graph`) run
  WITHOUT a transaction, so the tenant hook never fired and RLS returned 0 rows.
  Fixed with a pnpm patch on `@mikro-orm/knex`
  (`patches/@mikro-orm__knex@6.6.12.patch`) that wraps tenant-scoped reads in a
  transaction; `assertTenantReadPathPatchApplied()` startup guard; regression
  test `read-path-isolation.test.js`. Tenant context now holds on reads AND writes.
- **Seller admin ↔ tenant binding (Phase 1, Task 1.A):**
  - Concern 1 (resolve tenant from the logged-in admin): `/admin*` middleware
    reads `req.auth_context.app_metadata.tenant_id` (carried in the JWT);
    `Migration20260615000300` adds `user.tenant_id`; `create-seller-admin.ts`
    creates the user + emailpass credential and stamps tenant on both. Test
    header is gated behind `SELFKART_ALLOW_TEST_TENANT_HEADER=true`.
  - Concern 2 (isolate identity tables): `Migration20260615000400` puts RLS on
    `user` + `invite` (tenant-aware unique invite email);
    `auth_identity`/`provider_identity` left un-RLS'd (login needs them
    pre-tenant). `identity-isolation.test.js` regresses it.
  - Validated live: each seller logs into `/app` and sees ONLY their own
    products and admin users.
- **Tenant resource isolation wrapper for Medusa modules:** inventory items,
  inventory levels, stock locations, sales channels, and stock/sales/product
  link tables are now covered by reusable tenant-resource SQL helpers and
  `20260615000500-protect-inventory-stock-sales.ts`. Sales channels use a
  tenant-nullable policy so Medusa can keep its platform Default Sales Channel
  hidden from sellers while each seller sees only their own channels. Full RLS
  suite on disposable Neon branch `br-morning-surf-aoslb6jh`: **9 pass, 0 fail.**
- **Admin notification isolation:** the Medusa Admin notification feed reads the
  shared `notification` table, which was missing tenant protection. Added
  `20260616000100-protect-notifications.ts` to stamp tenant-context
  notifications, enable FORCE RLS, and make idempotency unique per tenant.
  Added `notification-isolation.test.js`; TypeScript verification passes. Full
  Neon runtime execution is pending approved temporary database credentials.
- **Seller CSV import wrapper:** added a Selfkart wrapper layer around Medusa's
  native product import. It parses seller CSV data, creates tenant-scoped
  taxonomy IDs, strips raw global taxonomy IDs from the Medusa upload CSV, and
  exposes a seller-facing Admin page at `/app/seller-import` plus backend routes
  for prepare/complete.
- **Production hardening:** production now throws if `JWT_SECRET` or
  `COOKIE_SECRET` are unset/default, and the test tenant header is disabled in
  production even if `SELFKART_ALLOW_TEST_TENANT_HEADER=true`. Production also
  throws if `SELFKART_STOREFRONT_SECRET` is unset/default (the storefront tenant
  is derived from this signed value, so a default secret = `/store*` forgery).
- **Storefront `/store*` domain tenant resolver — backend half (Phase 1, NEXT
  #1):** the buyer-facing tenant boundary on the Medusa side is built and
  validated. `tenants` + `tenant_domains` platform registry
  (`20260616000200-create-tenant-registry.ts`, deliberately NOT RLS'd — read
  before any tenant context exists, owned by `neondb_owner`, DML-granted to
  `medusa_app`). Server-to-server `/selfkart/resolve-domain` route maps an
  incoming host -> `tenant_id` + `publishable_key`, guarded by an HMAC-SHA256
  signature over the host (`domain-auth.ts`, `SELFKART_STOREFRONT_SECRET`) so
  only the Next.js server can call it. `domainTenantContextMiddleware` scopes
  `/store*` from a signed `x-selfkart-tenant-id` (browser cannot forge; RLS still
  fails closed if context is ever missing). `provision-tenant-storefront.ts`
  registers a tenant + domain and mints a publishable key linked to the tenant's
  sales channel (`pnpm provision:storefront`). Regression test
  `tests/integration/rls/domain-resolver-isolation.test.js` +
  `src/scripts/assert-domain-resolver.ts` prove the HMAC boundary is forge
  resistant and the registry resolves host->tenant, hides unknown hosts, and is
  readable with no tenant context. Validated on disposable Neon branch
  `domain-resolver-verify-20260616` (deleted after run): the new test passes
  standalone AND in the full pooled `medusa_app` suite.
- **Storefront `/store*` domain tenant resolver — FRONTEND half (Phase 1 NEXT #1,
  DoD MET):** the Next.js `apps/storefront/` app (Next `16.2.9`, standalone pnpm
  project; the repo has no workspace root). Tenant is derived server-side from
  the request Host — the browser never asserts a tenant. `src/lib/tenant/
  resolve-tenant.ts` reads the Host, signs it (`signing.ts`, mirrors the backend
  `domain-auth.ts` HMAC), calls `/selfkart/resolve-domain`, and is memoized per
  request with React `cache()`; fails closed to a "store not found" page on
  unknown host / bad sig / backend down. `src/lib/medusa/client.ts` builds a
  per-request Medusa JS SDK instance carrying the tenant's publishable key
  (sales-channel scoping) + signed `x-selfkart-tenant-id`/`-sig` headers (RLS
  scoping). Pages: product list (`/`) and detail (`/products/[handle]`), both
  `force-dynamic`; draft -> coming-soon, suspended -> unavailable. `proxy.ts`
  (Next 16 middleware rename, nodejs runtime) strips any inbound `x-selfkart-*`
  headers as defense-in-depth. `next build` + tsc pass. **Live E2E on disposable
  Neon branch `storefront-e2e-20260616` (deleted after run):** started Medusa +
  storefront against two provisioned domains (seller-a.localhost,
  seller-b.localhost) and curled with both Host headers — tenant A renders only
  A's catalog, B only B's (disjoint except the intentional `selfkart-rls-shared`
  canary handle, a distinct row per tenant); an A-only product handle returns 200
  under A's host and 404 under B's; unknown host -> "store could not be found";
  resolve-domain signed->200 / bad-sig->403 / unknown->404; rendered HTML leaks
  no tenant_id, signature, or secret. Buyer browse path is done; cart/checkout/
  order remain (later phase).
- **Seed idempotency fix (NEXT #3, done):** `seed-tenant-inventory-resources.ts`
  now upserts the tenant sales channel + stock location by their deterministic
  per-tenant id (`onConflict("id").merge(...)`, refreshing name/description)
  instead of checking by name and inserting — so re-seeding (or seeding a Neon
  branch reset from a `production` parent that already holds those rows) no
  longer collides on `*_pkey`. Full pooled `medusa_app` RLS suite now **11 pass,
  0 fail** (previously 2 failed on production-derived branches).
- **Buyer cart -> checkout -> order — storefront transactional half (Phase 1
  NEXT #1, IMPLEMENTED; live Neon E2E pending):** the buyer can now go
  cart -> shipping -> payment -> completed order, all RLS-scoped per tenant.
  - **Checkout-table RLS:** `20260616000300-protect-checkout-tables.ts` tenant-
    isolates the remaining checkout pipeline (the cart/order tables were already
    RLS'd in Phase 0B). Nullable-direct tenant_id on `price_set`, `price`,
    `payment_collection`, `payment`, `payment_session`, `fulfillment_set`,
    `service_zone`, `shipping_option`, `fulfillment`, `fulfillment_address`;
    join-derived policies on `price_rule`, `geo_zone`, `shipping_option_rule`,
    `capture`, `refund`, `fulfillment_item`, `fulfillment_label`,
    `shipping_option_price_set`, `location_fulfillment_set`,
    `location_fulfillment_provider` (all reuse `tenant-resource-sql.ts`).
    **`region`/`region_country`/`region_payment_provider` are deliberately left
    platform-shared (NOT RLS'd):** Medusa enforces one-country->one-region, so
    per-tenant regions sharing a country collide; the currency/country container
    is not seller data, while the sensitive data (prices, shipping rates,
    payments, fulfillments, orders) IS tenant-scoped. `payment_provider`,
    `fulfillment_provider`, `tax_provider`, `shipping_profile`,
    `shipping_option_type`, `refund_reason`, `price_preference`, `price_list` are
    also platform-shared. Tax tables (`tax_region`/`tax_rate`/`tax_rate_rule`)
    deferred to Phase 3 (no tax setup in the pilot).
  - **Per-tenant commerce provisioning:** `src/scripts/provision-tenant-commerce.ts`
    (`pnpm provision:commerce`) ensures the shared region (currency + country +
    `pp_system_default` manual payment), store supported-currency, and — inside
    the tenant context so RLS stamps tenant_id — the tenant's variant prices
    (opt-in via `SELFKART_PROVISION_PRICE_AMOUNT`), `manual_manual` fulfillment-
    provider link, fulfillment set, service zone (country geo zone), and a flat-
    rate shipping option. Idempotent; uses core-flows workflows wrapped in
    `runWithTenantContext` (the `@medusajs/utils` connection patch stamps each
    workflow transaction).
  - **Storefront:** `apps/storefront/` now has `/cart`, `/checkout`, and
    `/order/[id]` plus add-to-cart on the product list/detail. All cart/checkout
    mutations run through Next.js **Server Actions** (`src/lib/cart/actions.ts`)
    so the per-request signed tenant headers are attached server-side — the
    browser never carries tenant context. The cart id is an httpOnly, host-scoped
    cookie. SDK calls: region.list, cart.create/createLineItem/updateLineItem/
    deleteLineItem/update, fulfillment.listCartOptions, cart.addShippingMethod,
    payment.initiatePaymentSession (`pp_system_default`), cart.complete.
  - **Test:** `tests/integration/rls/checkout-isolation.test.js` +
    `src/scripts/assert-checkout-isolation.ts` assert (a) every checkout table is
    RLS-enabled/forced/policied and (b) a tenant-owned `price_set` is visible only
    to its tenant and never with no context.
  - **Verified — LIVE Neon-branch E2E PASSED (2026-06-16, commit 099afd1a9).**
    On a disposable branch (migrate as `neondb_owner`, provision two tenants,
    buy through both storefronts via the Store API with signed tenant headers):
    both tenants complete priced orders (A=100, B=150 usd), `calc_price` and live
    cart `unit_price` resolve under tenant RLS (pricing patch), `confirmInventory`
    confirms own stock (inventory patch), and cross-tenant order/cart reads 404.
    Full pooled `medusa_app` suite: **12 pass, 0 fail.** `next build` + `tsc` green.
  - **Fixes landed during the E2E (commit 099afd1a9):**
    1. **inventory patch never applied** — its hunk-header line counts were wrong
       (`-3,41 +3,59` vs actual 39/57), so `pnpm install` silently refused it
       (`ERR_PNPM_INVALID_PATCH`); GNU `patch --dry-run` had masked it. Corrected
       to `-3,39 +3,57`; the inventory tenant-context fix now actually loads.
    2. **`provision-tenant-storefront` cross-linked publishable keys** to the WRONG
       tenant's sales channel → `POST /store/carts` 500 in Medusa's pub-key
       middleware (RLS hides the foreign channel). Now resolves the tenant's own
       channel by deterministic seeded id + explicit `tenant_id` filter and ALWAYS
       (re)asserts the key↔channel link, self-healing crossed keys on re-run.
    3. **CSV-imported products had no `shipping_profile`** → `cart.complete` failed
       ("shipping profiles not satisfied"). `provision-tenant-commerce` now links
       every tenant product to the default shipping profile.
    Operator runbook: `docs/seller-onboarding.md`.

- **`api_key` tenant-scoping (KNOWN-GAP closed, commit `5ee701f50`, 2026-06-16):**
  `20260616000500-protect-api-key.ts` applies the tenant-NULLABLE RLS policy to
  `api_key` (reuses `tenant-resource-sql.ts`): per-tenant publishable/secret keys
  are stamped + isolated; Medusa's boot-time Default Publishable Key (created with
  no tenant context) stays `tenant_id` null = platform-only, hidden from sellers.
  Backfills existing keys' `tenant_id` from `tenant_domains.publishable_key=token`.
  `provision-tenant-storefront` now creates the publishable key INSIDE
  `runWithTenantContext` so it is stamped at creation. Safe for the storefront:
  Medusa's `maybeAttachPublishableKeyScopes` reads `api_key` INSIDE our `/store*`
  domain tenant context, so the `@mikro-orm/knex` read-path patch applies the GUC
  and the tenant's own (stamped) key resolves. Gate: `assert-api-key-isolation.ts`
  (`pnpm assert:api-key-isolation`) — A sees only A, B only B, no-context 0;
  **PASSED live on the dev DB 2026-06-16.** Follow-up (LOW): scope the
  `publishable_api_key_sales_channel` link table.
- **Platform superadmin console + operator onboarding (Phase 10 seed + Phase 11
  NEXT #5, commit `5ee701f50`, 2026-06-16):** new standalone Next.js app
  `apps/superadmin/` (Next 16 + Tailwind v4, port 3100) for PLATFORM operators
  (not sellers). Flow: public `/apply` form -> a `seller_applications` row
  (pending) -> operator clicks Approve in the console ->
  `provisionSellerFromApplication()` (`src/platform/provision-seller.ts`) runs the
  per-seller onboarding steps 1,3,4,5 in-process (create-seller-admin ->
  seed-inventory-resources -> provision:commerce -> provision:storefront, all
  idempotent/self-healing) and returns the seller's one-time admin credential ->
  tenant active; the seller logs into `/app` and imports their catalog (step 2).
  - **Platform tables (NON-RLS, same posture as `tenants`/`tenant_domains`):**
    `20260616000400-create-platform-admin.ts` adds `platform_admins`,
    `platform_admin_sessions`, `seller_applications`. The cross-tenant operator
    needs NO RLS bypass because platform state lives outside the per-tenant model.
  - **Auth:** routes under `/selfkart/platform/*` (OUTSIDE the tenant-jailed
    `/admin*`), guarded by `platformAuthMiddleware` (login route exempt; it matches
    `req.originalUrl` because Express strips the mount prefix from `req.path`).
    scrypt passwords, sha256-hashed opaque bearer sessions; the console SERVER
    forwards the session as `x-platform-session` (the browser never calls Medusa
    directly). Seed an operator with `pnpm create:platform-admin`.
  - **Provision scripts refactored:** `create-seller-admin` /
    `provision-tenant-commerce` / `provision-tenant-storefront` now export callable
    `(container, input)` functions reused by the orchestrator, keeping their CLIs.
  - **Console surfaces:** Dashboard (pending-application queue + tenant counts),
    Applications (approve/reject + retry on failed), Tenants, public Apply form.
  - **Verified:** backend `tsc` + superadmin `tsc`/`next build` green; DB-free auth
    unit tests pass; `assert-platform-admin-flow.ts` (`pnpm assert:platform-admin`)
    covers credential/session/application-lifecycle + subdomain uniqueness; full
    apply->approve->provision flow rendered against a stub backend
    (login/dashboard/applications/tenants/apply screenshotted).
- **Docs:** `apps/medusa/README.md` (multi-seller setup + per-seller flow);
  design doc `docs/superpowers/plans/2026-06-15-seller-admin-tenant-binding-design.md`;
  operator runbook `docs/seller-onboarding.md` (now points to the console flow).

### KNOWN GAPS / SECURITY TODO (must address before onboarding)

- ~~**MEDIUM:** `api_key` is NOT tenant-scoped (Medusa creates a platform Default
  Publishable API Key at boot with no tenant context). A seller can currently see
  other sellers' API keys.~~ **RESOLVED 2026-06-16 (commit `5ee701f50`):**
  `20260616000500-protect-api-key.ts` applies the tenant-nullable RLS policy +
  backfill; per-tenant keys isolated, boot-time Default key stays platform-null.
  `pnpm assert:api-key-isolation` passes live. Follow-up (LOW): scope the
  `publishable_api_key_sales_channel` link table. See the DONE entry above.
- **MEDIUM (functional):** invite RLS may break invite-acceptance (token lookup
  before the invitee has tenant context). Not exercised in the pilot (sellers are
  provisioned via `create-seller-admin`).
- ~~**MEDIUM (validate in E2E):** the checkout-pipeline tables now FORCE RLS …
  the live Neon E2E must confirm the full buy-through works.~~ **RESOLVED
  2026-06-16 (commit 099afd1a9):** live buy-through proven on a disposable branch
  — both tenants complete priced orders, prices/inventory resolve under tenant
  context, cross-tenant reads 404, pooled suite 12/12. Tenant context held through
  every cart/checkout/payment/fulfillment write and through Medusa's price-calc and
  inventory reads (the four pnpm patches + `runWithTenantContext`). Required two
  provisioning fixes (cross-linked keys, missing product↔shipping_profile — see the
  DONE entry).
- **DEFERRED:** tax tables (`tax_region`, `tax_rate`, `tax_rate_rule`) are not
  RLS'd. Safe while no tax is configured (pilot uses `automatic_taxes=false`);
  must be scoped in Phase 3 before enabling tenant taxes.
- ~~**LOW (test infra):** `seed-tenant-inventory-resources.ts` non-idempotent
  channel/location seeding collided on `*_pkey` on production-derived branches.~~
  **RESOLVED 2026-06-16:** now an `onConflict("id").merge(...)` upsert by the
  deterministic per-tenant id. Full RLS suite 11 pass / 0 fail.
- ~~**MEDIUM (functional):** a catalog imported AFTER provisioning was not sellable
  — no inventory levels, no product↔shipping_profile link, no store-currency
  price.~~ **RESOLVED 2026-06-17 (commit `9ec209f54`):** the in-admin import-complete
  route now heals all three, plus the `product-variant.created` hook covers
  hand-created products. **Still open (LOW):** the **CLI import path**
  (`prepare:seller-import` → native Admin importer → `link:seller-taxonomy`) does
  NOT call import-complete, so it still needs a manual `provision:commerce` +
  `backfill-tenant-currency-prices` afterward (dev/recovery only).
- **LOW (multi-region data):** USD/AED regions and the EUR region's countries are
  created **lazily** when the first seller of that market is provisioned. Until
  then those markets have no region. The stray Admin-created `eur` region was
  renamed `Selfkart EUR`. Seller A (`00…000b`) is a leftover broken test tenant
  with `currency=null` — delete it via the console to exercise the new delete flow.
- **LOW (open follow-up, restated):** scope the `publishable_api_key_sales_channel`
  link table (api_key itself is now tenant-scoped); move approve-time provisioning
  off the request thread onto a job/queue (runs inline today).

### NEXT (recommended order)

> Updated 2026-06-17. Buyer E2E, api_key scoping, operator onboarding flow, and
> multi-market + self-healing imports + delete are all DONE (see DONE section).
> What remains:

0. **Validate the 2026-06-17 multi-market flow end to end** (next concrete task —
   see §24). Apply for a store in each of US / UAE / Europe, approve, import a CSV,
   and confirm: the right region resolves, prices show in the market currency, and
   buy-through completes. India is already proven; the other three regions are
   created lazily on first provision and have not had a live buy-through yet.
1. **Tax-table RLS (Phase 3)** — `tax_region`/`tax_rate`/`tax_rate_rule` are NOT
   RLS'd. Required before enabling per-tenant taxes (pilot runs
   `automatic_taxes=false`). This is the main remaining isolation gap.
2. **Phase 2 tenant-registry hardening** — storefront already renders
   draft/suspended pages; add a real coming-soon/suspended template. Tenant-status
   admin now exists in the superadmin console (enable/disable/delete).
3. **R2 media with tenant-prefixed object keys** (storefront already allows remote
   image hosts). Optionally optimize the read path from per-query to per-request
   transaction (same GUC mechanism) if read latency demands.
4. **Engineering follow-ups (LOW):** scope `publishable_api_key_sales_channel`;
   move approve-time provisioning onto a job/queue (inline today); auto-heal the
   CLI import path (or fold it into the in-admin importer).
5. **Phase 11 full self-serve (longer horizon)** — the apply → approve → provision
   operator loop is live (`apps/superadmin`). Remaining toward fully self-serve:
   template/brand choice, Razorpay (Phase 7) + Shiprocket (Phase 8) connect,
   custom-domain + TLS automation, and making operator approval optional.

### Session commit trail (branch `phase0b-medusa-rls`)

```txt
fc99dbec0 feat: tenant-isolate admin user/invite tables (Phase 1 Concern 2)
b5b87a591 feat: apply tenant RLS on Medusa read path (Option 2 pnpm patch)
c7d022092 feat: bind seller admin to tenant via session (Phase 1 Concern 1)
1465b99b0 docs: record Phase 0B gate decision (GO, proceed to Phase 1)
a8af62049 test: add commerce, cross-tenant, and background job isolation tests
+ docs commits (README, design, spike results)
```

---

## 0. Current Decision State

### Passed on 2026-06-15

- Neon project: `selfkart`
- Neon project id: `jolly-rice-01919313`
- Region: `aws-ap-southeast-1`
- Postgres version: `17.10`
- Runtime app role: `medusa_app`
- Runtime role flags verified by Neon MCP:
  - `rolsuper = false`
  - `rolbypassrls = false`
  - `rolcanlogin = true`
- Migrator role: `neondb_owner`
  - `rolbypassrls = true`
  - Use only for migrations and schema ownership.
- Database-only pooled RLS smoke test passed:

```txt
ITERATIONS=500
CONCURRENCY=50
Runtime role: medusa_app
PASS: Postgres 17 RLS + SET LOCAL tenant isolation held under concurrent app connections
```

Smoke-test harness:

```txt
phase0-rls-smoke/run.sh
phase0-rls-smoke/README.md
```

### Phase 0B gate PASSED on 2026-06-15

The Medusa-level gate is now proven. Decision: **GO — freeze Medusa `2.15.5` +
Neon Postgres `17` through the 2-3 seller pilot and proceed to Phase 1.**

```txt
Database-only gate: PASS at 500 iterations, concurrency 50 (re-run as regression).
Medusa isolation suite (pooled medusa_app role): 5 pass, 0 fail.
  product-isolation, commerce-isolation, cross-tenant-lookup,
  background-job-isolation, concurrent-pooler.
Runtime role guard: not neondb_owner, rolsuper=false, rolbypassrls=false.
Validated on disposable Neon branches, deleted after each run.
```

The fallback (one Medusa instance/database per seller) was NOT triggered.

**Carry-forward into Phase 1 (out of scope for this gate):** RLS covers commerce
tables only. Admin identity tables (`user`, `auth_identity`, `provider_identity`,
`invite`, `api_key`) are NOT tenant-scoped, so admin users remain global. A
per-seller admin dashboard requires an admin-user ↔ tenant binding and
tenant-aware admin auth — track in Phase 1/Phase 5.

> **CORRECTION (2026-06-15): the gate's scope was narrower than "the app works".**
> The gate validated RLS + tenant context at the SQL level and on the WRITE path
> (seeds/writes run in transactions, which are tenant-stamped). During Phase 1
> seller-admin work, end-to-end HTTP testing revealed that Medusa's READ path
> (`query.graph`, MikroORM `@InjectManager` finds) runs WITHOUT a transaction, so
> the Phase 0B `set_config` hook never fires on reads and RLS fail-closes — a
> logged-in seller sees ZERO rows. This is safe (no leak) but makes the app
> unusable until the read path applies tenant context. "Medusa preserves tenant
> context through its APIs" is therefore NOT yet proven for reads. See
> `docs/superpowers/plans/2026-06-15-seller-admin-tenant-binding-design.md`
> (Validation results) for root cause and fix options. This must be resolved in
> Phase 1 before any seller onboarding.
>
> **RESOLVED (2026-06-15):** the read-path gap is fixed (Option 2 — pnpm patch on
> `@mikro-orm/knex` wraps tenant-scoped reads in a transaction). Validated end to
> end: a logged-in seller sees ONLY their own products; full RLS suite 6 pass,
> 0 fail including a `query.graph` read-path test. "Medusa preserves tenant
> context through its APIs" now holds for reads AND writes. See Task 1.A.

Do not onboard sellers until the admin binding's Concern 2 (RLS on identity
tables) and the storefront `/store*` domain resolver also land.

---

## 1. Documentation Sources Checked

Use these as the starting point for any implementation agent. Re-check with Context7 before coding because library behavior can change.

### Medusa

Context7 library: `/medusajs/medusa`

Relevant current-doc findings:

- Medusa v2 supports custom modules registered in `medusa-config.ts`.
- Medusa migrations use MikroORM migration classes from `@medusajs/framework/mikro-orm/migrations`.
- Medusa commerce capabilities are implemented through modules and workflows.
- Redis workflow engine can be configured as a Medusa module when production workflows need Redis persistence.

Pinned package versions:

```txt
@medusajs/medusa: 2.15.5
@medusajs/framework: 2.15.5
@medusajs/cli: 2.15.5
@medusajs/admin-sdk: 2.15.5
@medusajs/js-sdk: 2.15.5
```

Package manager rule:

```txt
Use pnpm for Medusa work. Prefer `corepack pnpm` so the repo's pinned `packageManager` version is used.
Do not add npm/yarn lockfiles.
```

### Neon

Context7 library: `/websites/neon`

Relevant current-doc findings:

- Use a custom backend role for RLS.
- The runtime role must have `LOGIN`.
- The runtime role must not have `BYPASSRLS`.
- Keep separate admin/migration and runtime connection strings.
- Neon pooled URLs use PgBouncer and the `-pooler` hostname form.
- Neon pooling is transaction-oriented, so tenant context must be transaction-local.

Required connection split:

```txt
MIGRATOR_DATABASE_URL = direct Neon URL using neondb_owner
APP_DATABASE_URL      = pooled Neon URL using medusa_app
```

### Next.js

Context7 library: `/vercel/next.js`

Relevant current-doc findings:

- Current Next.js version from the package registry: `16.2.9`.
- Next.js 16 renames `middleware` to `proxy` for network-boundary routing.
- Route Handlers can be used as a backend-for-frontend layer before proxying to Medusa.
- Server Components can fetch backend data server-side without exposing trusted tenant context to the browser.

Storefront rule:

```txt
Browser never sends tenant_id.
Next.js resolves tenant from Host.
Next.js server-side code calls Medusa with trusted tenant context.
```

---

## 2. Non-Negotiable Architecture Rules

1. Use Neon as the database host for the shared-RLS path.
2. Use Postgres RLS as the isolation boundary.
3. Runtime Medusa must connect as `medusa_app`, not `neondb_owner`.
4. `medusa_app` must never own tenant-scoped tables.
5. `medusa_app` must never have `BYPASSRLS`.
6. Tenant context must be set with `SET LOCAL app.current_tenant = '<uuid>'`.
7. `SET LOCAL` must run inside the same transaction as all tenant-scoped queries.
8. Tenant id must be derived server-side from domain/session, never from a browser-controlled header.
9. Platform admin access must be explicit and audited, not accidental "no tenant context sees all".
10. Every Medusa upgrade requires a table audit plus the full isolation suite.

---

## 3. Target Request Flow

```txt
Customer opens seller domain
  -> Next.js proxy/Route Handler reads Host
  -> tenant_domains lookup resolves tenant_id
  -> unknown/draft/suspended tenant returns safe page
  -> active tenant request continues
  -> server-side storefront code calls Medusa
  -> Medusa middleware derives tenant context from trusted source
  -> Medusa DB hook opens transaction
  -> hook runs SET LOCAL app.current_tenant = '<tenant_id>'
  -> Medusa service/workflow queries run inside that transaction
  -> Postgres RLS filters products/carts/orders/customers
  -> R2 media paths use tenant prefix
```

---

## 4. Proposed Repository Layout

Create this layout when implementation starts:

```txt
selfkart.com/
  apps/
    medusa/
      package.json
      medusa-config.ts
      src/
        api/
        jobs/
        subscribers/
        modules/
          tenant/
          tenant-context/
        migrations/
        workflows/
      tests/
        integration/
          rls/
          tenant-context/
    storefront/
      package.json
      next.config.ts
      proxy.ts
      src/
        app/
        lib/
          tenant/
          medusa/
        tests/
  docs/
    superpowers/
      plans/
  phase0-rls-smoke/
    run.sh
    README.md
```

---

## 5. Phase 0A - Database RLS Gate

**Status:** Passed.

**Goal:** Prove Neon Postgres 17 can enforce tenant isolation through the pooled app role.

**Files:**

- Existing: `phase0-rls-smoke/run.sh`
- Existing: `phase0-rls-smoke/README.md`
- Existing local secret file: `.env`

**Commands:**

```sh
set -a
source .env
set +a
ITERATIONS=500 CONCURRENCY=50 bash phase0-rls-smoke/run.sh
```

**Expected output:**

```txt
Runtime role: medusa_app
PASS: Postgres 17 RLS + SET LOCAL tenant isolation held under concurrent app connections
```

**DoD:**

- Postgres version is 17.x.
- App URL uses pooled Neon host.
- Runtime role is `medusa_app`.
- Runtime role has no `BYPASSRLS`.
- No rows are visible with no tenant context.
- Tenant A never sees Tenant B under concurrent load.
- Tenant context clears after transaction commit.

**Result:** Passed on 2026-06-15.

---

## 6. Phase 0B - Medusa Shared-RLS Gate

**Status:** Next required work.

**Goal:** Prove Medusa `2.15.5` can preserve tenant context for products, carts, customers, orders, and background jobs under pooled Neon connections.

**Kill Criteria:**

- Medusa queries escape the transaction that set `app.current_tenant`.
- Medusa workflow/cart/order/payment paths bypass tenant context in a way that cannot be patched cleanly.
- Required patch touches too much unstable framework internals.
- A pooled concurrent test shows cross-tenant leakage.

**Fallback if killed:** one Medusa instance/database per seller on Neon.

### Task 0B.1 - Scaffold Medusa Backend

**Files:**

- Create: `apps/medusa/package.json`
- Create: `apps/medusa/medusa-config.ts`
- Create: `apps/medusa/.env.example`
- Create: `apps/medusa/tsconfig.json`

**Requirements:**

- Pin every Medusa package exactly to `2.15.5`.
- Do not use `^` or `~` ranges for Medusa packages.
- Use pnpm and commit `pnpm-lock.yaml`; do not commit `package-lock.json` or `yarn.lock`.
- Use `MIGRATOR_DATABASE_URL` only for migrations.
- Use `APP_DATABASE_URL` only for runtime.

**Commands:**

```sh
mkdir -p apps/medusa
cd apps/medusa
corepack pnpm init
corepack pnpm add @medusajs/medusa@2.15.5 @medusajs/framework@2.15.5 @medusajs/cli@2.15.5 @medusajs/admin-sdk@2.15.5 @medusajs/js-sdk@2.15.5
corepack pnpm add -D typescript@5.7.3
```

**DoD:**

- `corepack pnpm list @medusajs/medusa --depth 0` returns `2.15.5`.
- `pnpm-lock.yaml` is committed.
- No Medusa package uses a loose semver range.
- `DATABASE_URL='postgres://postgres:postgres@127.0.0.1:5432/medusa_build_check' corepack pnpm exec medusa build` compiles the scaffold.

### Task 0B.2 - Add Tenant Context Module

**Files:**

- Create: `apps/medusa/src/modules/tenant-context/index.ts`
- Create: `apps/medusa/src/modules/tenant-context/service.ts`
- Create: `apps/medusa/src/modules/tenant-context/middleware.ts`
- Modify: `apps/medusa/medusa-config.ts`

**Behavior:**

- Store `tenant_id` in `AsyncLocalStorage`.
- Accept tenant id only from trusted server-side routes during the spike.
- For production, replace trusted test header with domain/session derivation.
- Reject tenant-scoped API requests without context.

**Test Cases:**

- Request with Tenant A context returns Tenant A rows only.
- Request with Tenant B context returns Tenant B rows only.
- Request with no context returns 403 or zero rows.
- Request trying to override tenant through browser-controlled header fails.

### Task 0B.3 - Patch or Hook Medusa DB Connection

**Files:**

- Create: `apps/medusa/src/modules/tenant-context/db-context.ts`
- Create: `apps/medusa/patches/`
- Modify only the minimum Medusa package needed to set transaction context. In the validated scaffold this is `@medusajs/utils@2.15.5` `ModulesSdkUtils.createPgConnection`, tracked through pnpm `patchedDependencies`.

**Required behavior:**

```sql
SET LOCAL app.current_tenant = '<tenant_id>';
```

Rules:

- Must run inside an open transaction.
- Must run before tenant-scoped queries.
- Must not use plain `SET`.
- Must not use session-level `RESET` as the safety mechanism.
- Must fail closed if tenant context is missing.

**DoD:**

- A startup check verifies the transaction patch is applied to Medusa utility package `2.15.5`.
- If the patch target file changes, startup fails loudly.
- A unit/integration test proves `current_setting('app.current_tenant', true)` is set only inside the transaction.

### Task 0B.4 - Add Phase 0 RLS Migrations

**Files:**

- Create: `apps/medusa/src/modules/tenant-context/migrations/Migration20260615000100.ts`
- Create: `apps/medusa/src/modules/tenant-context/service.ts`
- Modify: `apps/medusa/src/modules/tenant-context/index.ts`
- Modify: `apps/medusa/medusa-config.ts`

**Initial tenant-scoped tables:**

- product tables needed for product listing/detail
- cart tables needed for checkout preparation
- customer tables
- order tables

**Required behavior:**

- Register `tenant-context` as a minimal Medusa module so `medusa db:migrate` discovers its migrations.
- Add `tenant_id uuid` to tenant-owned product/cart/customer/order tables and child tables.
- Add a `BEFORE INSERT OR UPDATE OF tenant_id` trigger that stamps `tenant_id` from transaction-local `app.current_tenant`.
- Enable and force RLS on tenant-owned tables.
- Add `USING` and `WITH CHECK` policies based on `current_setting('app.current_tenant', true)`.
- Grant runtime DML to `medusa_app`.
- Grant runtime sequence usage to `medusa_app` for Medusa serial fields.
- Replace obvious global unique indexes, such as product handles and variant SKUs, with tenant-aware unique indexes.

**DoD:**

- No tenant-scoped table allows all rows when context is missing.
- Runtime grants go to `medusa_app`.
- `medusa_app` does not own the tables.
- Migration runs through `MIGRATOR_DATABASE_URL`, not `APP_DATABASE_URL`.
- Medusa inserts do not need application code to manually provide `tenant_id`; the database trigger stamps it from the active transaction context.

**Verification result on 2026-06-15:**

```txt
Temporary Neon branch: phase0b-rls-migration-verify-2
Medusa db:migrate: passed
Tenant isolation policies created: 49
Core table RLS forced: product, product_variant, cart, cart_line_item, customer, customer_address, order, order_line_item
Runtime medusa_app smoke: tenant_id stamped, no-context read hidden, wrong-tenant read hidden
```

**Critical follow-up discovered during verification and completed in Task 0B.4A:**

Medusa creates link tables after module migrations during `db:migrate`. These tables were created after `Migration20260615000100`, so they need a separate post-link RLS step before the Medusa API leak suite can pass.

Examples:

```txt
product_sales_channel
product_variant_inventory_item
product_variant_price_set
cart_payment_collection
order_cart
order_payment_collection
```

### Task 0B.4A - Add RLS for Medusa Link Tables

**Status:** Completed on 2026-06-15.

**Goal:** Cover Medusa-generated link tables that are created after module migrations.

**Implementation:**

- Added `apps/medusa/src/migration-scripts/20260615000200-protect-link-tables.ts`.
- Uses Medusa's `src/migration-scripts` mechanism, which runs after module migrations and link sync during `db:migrate`.
- Enables and forces RLS on generated link tables that connect to tenant-owned records.
- Uses join-based policies that derive ownership from the tenant-scoped side of the link instead of adding a duplicate `tenant_id` column.
- Re-grants table DML and sequence privileges to `medusa_app` after link tables are created.

**Covered link tables:**

```txt
cart_payment_collection
cart_promotion
customer_account_holder
order_cart
order_fulfillment
order_payment_collection
order_promotion
return_fulfillment
product_sales_channel
product_shipping_profile
product_variant_inventory_item
product_variant_price_set
```

**Verification result on 2026-06-15:**

```txt
Temporary Neon branch: phase0b-link-rls-verify
Medusa db:migrate: passed
Link-table tenant isolation policies created: 12
All 12 scoped link tables have RLS enabled and forced
Script migration row completed: 20260615000200-protect-link-tables.ts
Runtime medusa_app link smoke: tenant link visible, no-context hidden, wrong-tenant hidden
```

**Remaining validation risk for API tests:**

Payment, fulfillment, and pricing tables are not fully tenantized by this step.
Inventory, stock-location, and sales-channel isolation was completed later in
Task 0B.4B. The Medusa API leak suite must continue proving tenant-facing
workflows do not expose remaining shared module rows directly.

### Task 0B.4B - Add Tenant Resource Isolation for Inventory, Stock, and Sales Modules

**Status:** Completed on 2026-06-15.

**Goal:** Make the module rows that caused shared seller inventory/admin views
tenant-scoped in a reusable way, so future Shiprocket and Razorpay tables can use
the same wrapper pattern.

**Implementation:**

- Added `apps/medusa/src/modules/tenant-context/tenant-resource-sql.ts`.
- Added `apps/medusa/src/migration-scripts/20260615000500-protect-inventory-stock-sales.ts`.
- `inventory_item`, `stock_location`, `stock_location_address`, and seller
  `sales_channel` rows are tenant-owned.
- `inventory_level`, `reservation_item`, `product_sales_channel`,
  `product_variant_inventory_item`, and `sales_channel_stock_location` derive
  ownership from both sides of their relationships where applicable.
- `sales_channel` supports hidden platform-null rows for Medusa bootstrap while
  tenant contexts see only tenant-owned sales channels.
- Added `seed-tenant-inventory-resources.ts` to create/reuse seller sales
  channel, stock location, sales-channel stock-location link, product sales
  channel links, and positive inventory levels after product import.

**Verification result on 2026-06-15:**

```txt
Temporary Neon branch: codex-tenant-resource-isolation-20260615d (br-morning-surf-aoslb6jh)
Medusa db:migrate with neondb_owner: passed
Schema check: inventory_item, inventory_level, reservation_item, stock_location,
  stock_location_address, sales_channel, product_sales_channel,
  product_variant_inventory_item, sales_channel_stock_location all have forced RLS
Suite command: APP_DATABASE_URL=<medusa_app pooled url> ITERATIONS=500 CONCURRENCY=50 \
  corepack pnpm test:rls
Result: 9 pass, 0 fail
```

### Task 0B.5 - Seed Two Tenants

**Files:**

- Create: `apps/medusa/src/scripts/seed-tenants.ts`

**Tenants:**

```txt
Tenant A: 00000000-0000-0000-0000-00000000000a
Tenant B: 00000000-0000-0000-0000-00000000000b
```

**Seed data:**

- Tenant A: 2 products, 1 customer, 1 cart, 1 order.
- Tenant B: 2 products, 1 customer, 1 cart, 1 order.

**DoD:**

- [x] Data is written with the correct `tenant_id`.
- [x] Tenant A and Tenant B have overlapping names/SKUs in test data to catch missing tenant scoping.

**Implementation result on 2026-06-15:**

```txt
Implemented: apps/medusa/src/scripts/seed-tenants.ts
Tenant data: 2 products, 1 customer, 1 cart, 1 order per tenant
Overlapping product handle: selfkart-rls-shared
Validated on temporary Neon branch: phase0b-seed-rls-verify
Runtime role: medusa_app through pooled Neon URL
```

### Task 0B.6 - API and Workflow Isolation Tests

**Files:**

- Create: `apps/medusa/tests/integration/rls/product-isolation.test.js`
- Create: `apps/medusa/tests/integration/rls/commerce-isolation.test.js` (cart + customer + order list isolation, one file)
- Create: `apps/medusa/tests/integration/rls/cross-tenant-lookup.test.js` (direct foreign-id lookup + cross-tenant update for product/cart/customer/order)
- Create: `apps/medusa/tests/integration/rls/concurrent-pooler.test.js`
- Create: `apps/medusa/tests/integration/rls/background-job-isolation.test.js`

> Note: cart/customer/order list isolation was consolidated into a single
> `commerce-isolation.test.js` (table-driven) instead of three separate files,
> and cross-tenant direct-lookup assertions live in `cross-tenant-lookup.test.js`.
> All tests assert at the RLS layer through the pooled `medusa_app` role,
> matching the proven `product-isolation.test.js` pattern.

**Required assertions:**

- Tenant A product list contains zero Tenant B rows.
- Tenant B product list contains zero Tenant A rows.
- Direct lookup of another tenant's product returns 404 or forbidden.
- Carts cannot cross tenants.
- Customers cannot cross tenants.
- Orders cannot cross tenants.
- Background jobs must either run tenant-scoped or explicitly platform-scoped.
- 500 concurrent pooled requests show no cross-tenant rows.

**DoD:**

- At least 20 automated isolation tests pass.
- Concurrent test uses the Neon pooled URL.
- Tests fail if `APP_DATABASE_URL` uses `neondb_owner`.
- Tests fail if `rolbypassrls = true`.

**Current test result on 2026-06-15:**

```txt
Implemented: apps/medusa/tests/integration/rls/product-isolation.test.js
Command: APP_DATABASE_URL=<medusa_app pooled url> node --test tests/integration/rls/product-isolation.test.js
Result: 1 pass, 0 fail
Coverage: seeded product list isolation plus no-context zero-row assertion
Implemented: apps/medusa/tests/integration/rls/concurrent-pooler.test.js
Command: APP_DATABASE_URL=<medusa_app pooled url> ITERATIONS=500 CONCURRENCY=50 node --test --test-concurrency=1 tests/integration/rls/*.test.js
Result: 2 pass, 0 fail
Coverage added: runtime role guard plus 500 tenant probes at concurrency 50 through the Neon pooler
```

**Additional isolation tests added and validated on 2026-06-15:**

```txt
Implemented: apps/medusa/tests/integration/rls/commerce-isolation.test.js
  Coverage: cart/customer/order seeded-row list isolation per tenant + no-context zero-row assertion (table-driven over all three entities)
Implemented: apps/medusa/tests/integration/rls/cross-tenant-lookup.test.js
  Coverage: positive own-id lookup, foreign-id lookup returns zero rows, and cross-tenant UPDATE matches zero rows for product/cart/customer/order
Implemented: apps/medusa/tests/integration/rls/background-job-isolation.test.js
  Coverage: tenant-scoped job reuses pooled connections across tenants with no leakage; misconfigured job that skips set_config fails safe to zero rows

Validation run on 2026-06-15:
  Temporary Neon branch: phase0b-isolation-tests-verify (br-autumn-union-ao5avi7s), deleted after run
  Migrated with neondb_owner direct URL: passed (4 core tenant_id columns, 61 policies)
  Suite command: APP_DATABASE_URL=<medusa_app pooled url> ITERATIONS=500 CONCURRENCY=50 \
    node --test --test-concurrency=1 tests/integration/rls/*.test.js
  Result: tests 5, pass 5, fail 0 (full suite: product, commerce, cross-tenant, background-job, concurrent-pooler)
  Runtime role: medusa_app through pooled Neon URL, rolsuper=false, rolbypassrls=false
```

---

## 7. Phase 1 - Stack Foundation

**Goal:** Get the production-like skeleton running after Phase 0B passes.

**Files:**

- Modify: `apps/medusa/medusa-config.ts`
- Create: `apps/storefront/package.json`
- Create: `apps/storefront/next.config.ts`
- Create: `apps/storefront/proxy.ts`
- Create: `apps/storefront/src/lib/tenant/resolve-tenant.ts`
- Create: `apps/storefront/src/lib/medusa/client.ts`

**Tasks:**

- Create Next.js `16.2.9` storefront.
- Use `proxy.ts` for domain-level routing because Next.js 16 renamed middleware to proxy.
- Use Route Handlers or Server Components to call Medusa server-side.
- Add Medusa health endpoint.
- Add R2 media config with tenant-prefixed object keys.
- Add Redis config for cache and workflow engine when required.

**DoD:**

- [x] Product can be created in Medusa for Tenant A.
- [x] Tenant A storefront renders Tenant A product. (Live E2E 2026-06-16.)
- [x] Tenant B storefront does not render Tenant A product. (A-only handle 404s
  under B's host; catalogs disjoint; no tenant_id leak in HTML.)
- [ ] Media loads from tenant-prefixed R2 path. (Storefront allows remote image
  hosts; R2 tenant-prefixing not yet wired — tracked in NEXT.)

### Task 1.A - Seller Admin ↔ Tenant Binding

**Design:** `docs/superpowers/plans/2026-06-15-seller-admin-tenant-binding-design.md`

**Goal:** A seller logs into the Medusa Admin (`/app`) and sees only their own
data. Split into two concerns: (1) resolve tenant from the authenticated admin
session; (2) isolate the admin identity tables themselves.

**Status (2026-06-15):**

```txt
DONE - Migration: add tenant_id to "user" (Migration20260615000300), index, no RLS yet.
DONE - src/scripts/create-seller-admin.ts: creates user + emailpass identity and
       stamps tenant_id into both user.tenant_id and auth_identity.app_metadata.
DONE - src/api middleware: /admin* tenant resolved from req.auth_context.app_metadata
       (test header kept behind SELFKART_ALLOW_TEST_TENANT_HEADER=true only).
DONE - Spike: authenticate() never reads "user"; /admin auth runs before custom
       middleware; JWT carries app_metadata.tenant_id. Proven end to end.
DONE - Read-path RLS fix (Option 2): pnpm patch on @mikro-orm/knex wraps
       tenant-scoped reads in a transaction so the set_config hook fires on reads.
       patches/@mikro-orm__knex@6.6.12.patch + assertTenantReadPathPatchApplied()
       startup guard + tests/integration/rls/read-path-isolation.test.js.
       Validated end to end: seller sees ONLY their data; full suite 6 pass, 0 fail.
       Optimize to per-request txn (Option 1) later if read latency demands.
DONE - Concern 2: RLS on user + invite (Migration20260615000400) reusing the
       selfkart_set_tenant_id trigger; invite global unique email -> tenant-aware
       unique; auth_identity/provider_identity left un-RLS'd (login needs them).
       create-seller-admin provisions the user inside a tenant context so the RLS
       WITH CHECK passes. Validated live: seller-a /admin/users shows only seller-a,
       seller-b only seller-b.
DONE - Tenant resource isolation: inventory_item, inventory_level,
       reservation_item, stock_location, stock_location_address, sales_channel,
       product_sales_channel, product_variant_inventory_item, and
       sales_channel_stock_location are RLS-protected. Full suite 9 pass, 0 fail.
DONE - Admin notification isolation: notification now has nullable tenant_id,
       tenant stamping trigger, FORCE RLS policies, tenant-aware idempotency
       uniqueness, and notification-isolation.test.js. TypeScript passes; full
       Neon medusa_app test execution is pending approved temporary DB URLs.
DEFER - api_key RLS: Medusa creates a platform "Default Publishable API Key" at
       boot with no tenant context; needs a tenant-nullable model. Tracked.
DONE - /store* domain tenant resolver, BACKEND half: tenants + tenant_domains
       registry (20260616000200), HMAC host/tenant signing (domain-auth.ts),
       /selfkart/resolve-domain route, domainTenantContextMiddleware on /store*,
       provision-tenant-storefront.ts, SELFKART_STOREFRONT_SECRET prod guard, and
       domain-resolver-isolation.test.js (passes standalone + in-suite on a
       disposable Neon branch). Browser cannot forge tenant; RLS still fails closed.
DONE - /store* storefront FRONTEND: Next.js apps/storefront/ app. Tenant from
       Host server-side -> resolve-domain (HMAC) -> per-request SDK with signed
       tenant headers + publishable key -> product list/detail. proxy.ts strips
       inbound x-selfkart-* headers. Live E2E on a disposable Neon branch: A
       renders only A's catalog, B only B's; A-only handle 404s under B's host;
       unknown host -> store-not-found; no tenant_id/secret leak in HTML.
DONE  - Buyer cart -> checkout -> order on the storefront (transactional half),
       IMPLEMENTED + compiles; live Neon E2E pending. Checkout-pipeline RLS
       (20260616000300-protect-checkout-tables: price*/payment*/fulfillment*/
       shipping_option/service_zone; region stays platform-shared),
       provision-tenant-commerce.ts (shared region + manual payment/fulfillment +
       per-tenant prices/shipping option), storefront /cart + /checkout +
       /order/[id] via Server Actions (signed tenant headers server-side, httpOnly
       cart cookie), and checkout-isolation.test.js. See the handoff DONE section.
```

---

## 8. Phase 2 - Tenant Registry and Domain Routing

**Goal:** One storefront deployment serves all seller domains safely.

**Tables:**

```sql
create table if not exists tenants (
  id uuid primary key,
  name text not null,
  slug text unique not null,
  status text not null check (status in ('draft', 'active', 'suspended')),
  plan text,
  owner_user_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tenant_domains (
  id text primary key,
  tenant_id uuid not null references tenants(id),
  domain text unique not null,
  type text not null check (type in ('subdomain', 'custom')),
  is_primary boolean default false,
  verification_status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists tenant_theme_config (
  tenant_id uuid primary key references tenants(id),
  template_id text not null,
  logo_url text,
  primary_color text,
  secondary_color text,
  font_family text,
  homepage_sections jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Routing states:**

- `active`: render storefront.
- `draft`: render coming-soon page.
- `suspended`: render unavailable page.
- unknown domain: render platform landing or 404 with no tenant data.

**DoD:**

- Add a subdomain without frontend redeploy.
- Add a custom domain without frontend redeploy.
- Unknown domain leaks no data.

---

## 9. Phase 3 - Full Medusa RLS Hardening

**Goal:** Extend tenant isolation beyond the Phase 0 tables.

**Tasks:**

- Inventory every Medusa table after migrations.
- Classify each table as `tenant-scoped`, `shared-reference`, or `platform-only`.
- Add `tenant_id`, indexes, grants, and RLS policies to every tenant-scoped table.
- Scope unique constraints by tenant where needed.
- Add CI table-audit script.

**High-risk tables to audit carefully:**

- product and variant tables
- price/listing tables
- inventory and stock-location link tables
- cart and line-item tables
- order and payment tables
- customer and address tables
- promotion/discount tables
- fulfillment/shipping tables
- upload/media tables
- link tables created by Medusa modules

**DoD:**

- Every tenant-scoped table has RLS enabled and forced.
- Every tenant-scoped table has a `tenant_id` index.
- CI fails if a new Medusa table is not classified.
- CI fails if a tenant-scoped table lacks an RLS policy.

---

## 10. Phase 4 - Theme and Template System

**Goal:** Customization without seller-specific code branches.

**Allowed seller controls:**

- logo
- colors
- font choice
- hero content
- section order
- featured collections
- WhatsApp/social links
- about/policy pages
- SEO metadata

**Forbidden before 10 paying sellers:**

- custom React per seller
- custom checkout per seller
- seller-specific frontend branches
- seller-specific Medusa modules

**DoD:**

- Tenant A and Tenant B show different branding from database config.
- Changing theme config requires no deploy.

---

## 11. Phase 5 - Seller Admin and RBAC

**Goal:** Sellers manage only their own store.

**Tables:**

```sql
create table if not exists tenant_users (
  id text primary key,
  tenant_id uuid not null references tenants(id),
  user_id text not null,
  role text not null check (role in ('tenant_admin', 'tenant_staff')),
  status text not null default 'active',
  created_at timestamptz default now(),
  unique (tenant_id, user_id)
);
```

**Rules:**

- Tenant for seller admin comes from authenticated session.
- Browser-sent tenant id is ignored.
- Platform owner access is a separate audited path.

**DoD:**

- Tenant staff cannot access another tenant by changing URL, header, or request body.
- Platform owner impersonation writes audit logs.

---

## 12. Phase 6 - CSV Catalog Import

**Goal:** Avoid manual catalog entry.

**Tasks:**

- Define one CSV template.
- Build parser and validation.
- Show import preview before write.
- Write imports inside tenant-scoped transaction.
- Store import logs per tenant.
- Throttle imports per tenant.

**DoD:**

- Failed import leaves no partial product data.
- Import cannot write to the wrong tenant.
- Duplicate SKUs are checked per tenant, not globally.

---

## 13. Phase 7 - Razorpay Per Tenant

**Goal:** Seller money flows directly to each seller's Razorpay account.

**Tables:**

```sql
create table if not exists tenant_integrations (
  tenant_id uuid primary key references tenants(id),
  razorpay_key_id text,
  razorpay_key_secret_encrypted text,
  razorpay_webhook_secret_encrypted text,
  shiprocket_credentials_encrypted text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Rules:**

- Checkout loads Razorpay credentials from tenant context.
- Webhook lookup uses `tenant_id + razorpay_order_id`.
- Webhook secret is per tenant.
- Idempotency key is per tenant and external id.

**DoD:**

- Tenant A checkout uses Tenant A Razorpay key.
- Tenant B webhook cannot update Tenant A order.
- Invalid webhook secret fails closed.

---

## 14. Phase 8 - Shiprocket Per Tenant

**Goal:** Each seller ships from their own Shiprocket credentials.

**Tasks:**

- Store encrypted Shiprocket credentials per tenant.
- Create shipment only for tenant-owned paid order.
- Store shipment id with tenant id.
- Verify tracking webhook by tenant and external id.
- Add retry queue with tenant id in payload.

**DoD:**

- Tracking webhook cannot update another tenant's shipment.
- Retry job preserves tenant context.

---

## 15. Phase 9 - Usage Tracking and Billing

**Goal:** Know per-tenant usage before enforcing plans.

**Tables:**

```sql
create table if not exists tenant_usage_monthly (
  id text primary key,
  tenant_id uuid not null references tenants(id),
  month text not null,
  visitors integer default 0,
  orders integer default 0,
  products integer default 0,
  storage_gb numeric default 0,
  api_calls integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, month)
);
```

**DoD:**

- Monthly usage dashboard shows each seller.
- Near-limit seller is flagged.
- No hard shutdown before manual review during pilot.

---

## 16. Phase 10 - Platform Admin

**Goal:** Operate the SaaS in under one hour per day.

> **Status (2026-06-16, commit `5ee701f50`): seeded.** `apps/superadmin` console
> is live with Dashboard (active/draft/suspended tenant counts + pending-application
> queue), Applications (approve/reject/retry), and Tenants views. Still to add from
> the list below: failed payments / shipments / webhooks / imports, near-limit +
> high-traffic tenants, and audit events.

**Dashboard must show:**

- active/draft/suspended sellers
- failed payments
- failed shipments
- failed webhooks
- failed imports
- near-limit tenants
- high-traffic tenants
- recent audit events

**DoD:**

- Normal support issues can be debugged without direct database access.

---

## 17. Phase 11 - Automated Onboarding

**Goal:** Reduce manual seller setup time.

> **Status (2026-06-16, commit `5ee701f50`): operator-gated flow live.**
> `apps/superadmin` implements apply -> approve -> provision (create-seller-admin
> -> seed-inventory-resources -> provision:commerce -> provision:storefront)
> returning the seller's first admin credential; the seller then logs into `/app`
> and imports their CSV. Orchestrator: `apps/medusa/src/platform/provision-seller.ts`.
> Still to reach the self-serve DoD below: template/brand choice, Razorpay +
> Shiprocket connect, custom-domain + TLS, and making operator approval optional.
> (Provisioning currently runs inline in the approve request — move to a job/queue
> before high volume.)

**Flow:**

```txt
signup -> create tenant -> choose template -> brand -> upload CSV -> connect Razorpay -> connect Shiprocket -> add domain -> preview -> go live
```

**DoD:**

- A seller with clean catalog data can self-serve most setup.
- Your manual work is under 30 minutes per seller.

---

## 18. Phase 12 - Permanent Security and Reliability Suite

**Goal:** Prevent regressions after the pilot.

**Permanent CI tests:**

- Tenant A cannot see Tenant B products.
- Tenant A cannot see Tenant B carts.
- Tenant A cannot see Tenant B customers.
- Tenant A cannot see Tenant B orders.
- Unknown domain leaks nothing.
- Suspended tenant cannot accept orders.
- Pooled concurrent leak test passes.
- Background jobs preserve or explicitly declare tenant scope.
- Runtime role is not owner/superuser/BYPASSRLS.
- New table audit passes.

**DoD:**

- CI blocks deployment on any isolation regression.

---

## 19. Phase 13 - First Paid Pilot

**Goal:** Validate with 2-3 real sellers.

**Pilot requirements:**

- Seller already has products.
- Seller understands you do not bring traffic.
- Seller accepts setup fee and monthly subscription.
- Seller uses own Razorpay and Shiprocket.
- Seller provides clean catalog data.

**Freeze rule:**

Do not upgrade Medusa during this phase unless a security issue forces it. Keep `2.15.5` until 2-3 sellers are live and stable.

**DoD:**

- 2-3 sellers live.
- Real orders processed.
- Zero tenant leakage.
- Support load is manageable.

---

## 20. Phase 14 - Scale to 10

**Goal:** Make onboarding repeatable.

**Tasks:**

- Polish CSV preview.
- Polish seller admin.
- Write seller docs.
- Publish demo store.
- Add pricing page.
- Use pilot referrals.

**DoD:**

- 10 paying sellers.
- Repeatable onboarding.
- Less than one hour per day support.

---

## 21. Phase 15 - Scale to 50-100

**Goal:** Keep shared infrastructure stable.

**Tasks:**

- Add per-tenant rate limits.
- Add import throttling.
- Add failed-job dashboard.
- Add billing automation.
- Add plan upgrade flow.
- Add incident checklist.
- Move heavy/noisy sellers to dedicated fallback.

**DoD:**

- 50+ sellers operate without daily manual debugging.
- Heavy sellers are identified and isolated.

---

## 22. Upgrade Policy

Until 2-3 pilot sellers are live and stable:

- Freeze Medusa at `2.15.5`.
- Freeze Medusa SDK packages at `2.15.5`.
- Freeze Neon Postgres at `17`.
- Do not upgrade Medusa reactively.
- Do not change database host.
- Do not expand product scope before Phase 0B passes.

For every future Medusa upgrade:

1. Create Neon staging branch.
2. Run Medusa migrations as migrator role.
3. Diff table list before/after.
4. Classify any new tables.
5. Add RLS policies to new tenant-scoped tables.
6. Run full isolation suite.
7. Run pooled concurrent leak test.
8. Promote only after all tests pass.

---

## 23. Agent Handoff Protocol

Every implementation agent must do this before coding:

1. Read this file.
2. Use `context7-mcp` for current docs of any library being touched.
3. Use Neon MCP for database inspection, not ad hoc assumptions.
4. Never print database URLs or passwords.
5. Never use `neondb_owner` for runtime app tests.
6. Run the relevant test before and after changes.
7. Update this plan if a gate changes status.

For implementation execution:

- Recommended: use `superpowers:subagent-driven-development`.
- Alternative: use `superpowers:executing-plans`.
- Work phase by phase.
- Do not start Phase 1 until Phase 0B passes.

---

## 24. Immediate Next Task

See **"Implementation Progress / Handoff"** at the top of this doc for the full
running state. In short:

- Phase 0B PASSED; Phase 1 seller-admin binding (Task 1.A, Concerns 1 + 2) is DONE
  and validated. The admin side is tenant-isolated and the read path is fixed.
- Admin tenant resolution is no longer a spike: it derives from the authenticated
  admin's JWT (`app_metadata.tenant_id`). The test header is gated behind
  `SELFKART_ALLOW_TEST_TENANT_HEADER`.

- Phase 1 storefront `/store*` domain resolver is DONE end to end: the Medusa
  backend half (registry + HMAC + resolve-domain + `/store*` middleware + provision
  script) and the Next.js `apps/storefront/` app (tenant-from-Host, per-request
  signed SDK, product browse). DoD MET and live-validated: Tenant A renders only
  A's catalog, Tenant B only B's. See the handoff DONE section for E2E details.

- Buyer cart -> checkout -> order (Phase 1 NEXT #1) is **DONE and live-validated**
  (commit 099afd1a9): storefront `/cart` `/checkout` `/order/[id]` via Server
  Actions; checkout-pipeline RLS migration; `provision:commerce` /
  `provision:storefront` (now self-healing + shipping-profile linking);
  `checkout-isolation` test. Live buy-through proven on a disposable branch, pooled
  suite 12/12. Operator runbook: `docs/seller-onboarding.md`.

- **Multi-market (India/US/UAE/Europe), self-healing imports, and tenant delete are
  DONE** (2026-06-17, commit `9ec209f54`) — see the handoff DONE section. India is
  live-proven; US/UAE/Europe regions are created lazily on first provision and have
  not yet had a live buy-through.

Do next, in order (also in NEXT at the top):

1. **Validate US / UAE / Europe end to end** — apply → approve → import CSV →
   confirm region/currency resolves, prices show in the market currency, and
   buy-through completes (India already proven). The catalog CSVs carry
   INR/USD/EUR/AED prices; import auto-heals stock + shipping profile + price.
2. **Phase 3 tax-table RLS** (`tax_region`/`tax_rate`/`tax_rate_rule`) before
   enabling per-tenant taxes — the main remaining isolation gap.
3. R2 media with tenant-prefixed object keys; optional read-path per-request
   transaction optimization.
4. Engineering follow-ups (LOW): scope `publishable_api_key_sales_channel`;
   approve-time provisioning onto a job/queue; auto-heal the CLI import path.
