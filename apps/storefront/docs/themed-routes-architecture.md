# Themed Routes Architecture — Design & Migration Plan

> Status: **In progress** · Owner: storefront · Last updated: 2026-06-21
>
> This is the living source of truth for migrating the storefront from
> "static template demos + unstyled real pages" to **one router, many skins**.
> Check off todos here as they land. See the companion authoring guide:
> [`THEMES_PLAYBOOK.md`](./THEMES_PLAYBOOK.md).

---

## 1. Problem (why we're doing this)

The storefront currently has **two parallel page systems that never meet**:

| | Root routes (`/`, `/products/[handle]`, `/cart`, `/checkout`, …) | `/preview/<template>/*` (5–20 pages each) |
|---|---|---|
| Wired to Medusa? | ✅ Yes (real tenant, products, cart, Razorpay) | ❌ No — 100% static mock |
| Styled with the template? | ❌ Only `/` is; PDP/cart/checkout are bare HTML | ✅ Fully styled |
| Intended audience | Real buyers | Seller preview |

Result: **the beautiful pages are fake, the real pages are ugly.** A buyer on a
Volt store gets a styled home → clicks a product → lands on an unstyled `<main>`
PDP with no nav. Every template also *duplicates the whole store* as static
pages, so any new feature means hand-editing 5 page trees with no enforcement.

## 2. Target model

Separate the three concerns that are currently tangled:

```
ROUTE (url + data)  →  ONE per page, identical for every design
DATA  (Medusa)      →  fetched once, in the route, via a shared data layer
THEME (design)      →  a per-template component that just renders the data
```

- **One route set** for every store/design: `/`, `/shop`, `/products/[handle]`,
  `/cart`, `/checkout`, `/deals`, `/order/[id]`, `/collections/[handle]`.
- Each route: `resolveTenant()` → fetch real Medusa data via the shared data
  layer → `getTheme(template_id).<Slot>(props)`. Only the rendered component
  differs per design.
- Themes are **pure presentation** — they receive theme-agnostic **view models**
  as props and never import Medusa.
- A **theme registry** (`StoreTheme` interface) makes the compiler enforce that
  every theme implements every page slot.
- `/preview/<template>/*` is **demoted to preview-only** (the "see dummy data
  before choosing" screen) — never a buyer's path.

```
cloth.myselfkart.com/shop?category=men
  → resolveTenant()                tenant + publishable key + signed RLS headers
  → shared data layer              listProducts / getRegion / getPromotions / getCategories
  → map Medusa DTOs → VIEW MODELS  ProductView, DealView, CategoryView …
  → getTheme(id).Shop({ ... })     design only
```

## 3. Key decisions

- **View models are the seam.** Medusa shape changes never reach themes; theme
  changes never reach Medusa. (Generalises today's `toVoltProduct` +
  `merchandising.ts`.)
- **Graceful degradation is a rule, not a feature.** A section with no backing
  data (deals without promotions, best-sellers without sales) hides; nothing is
  fabricated. See playbook §"Graceful degradation".
- **Catalog items are generic.** eventpass maps `StoreProduct → Event`; same
  routes/data, different labels + layout. A non-product vertical is a skin, not a
  new router.
- **Tenant isolation is automatic** via `getTenantMedusa(tenant)` (publishable
  key + signed RLS headers). Themes inherit it for free.

## 4. Phases & todos

Legend: `[ ]` todo · `[x]` done · `[~]` partial/interim

### Phase 0 — Foundation (no behaviour change) ✅ DONE

- [x] Define `StoreTheme` interface + per-slot prop types (`lib/themes/types.ts`)
- [x] Define shared **view models** (`ProductView`, `CategoryView`, `CartView` alias, `VariantView`) in `lib/views/`
- [x] Build the theme registry + `getTheme()` (`lib/themes/index.ts`) with a `DefaultTheme` fallback (`lib/themes/default.tsx`)
- [x] `merchandising.ts` derivations surfaced through the view-model mappers (`mapProduct`, `deriveCategoriesFromTags`)
- [x] Doc: this file + playbook created and kept in sync
- Note: additive only — routes still use their per-route `switch`; registry is wired in Phase 1.

### Phase 1 — Volt as the reference migration ✅ DONE (catalog slots)

- [x] Volt `/shop` (listing + tag-category filter) via `VoltTheme.Shop`, view-model driven
- [x] Volt `/deals` (real sale prices, honest empty state) via `VoltTheme.Deals`
- [x] Volt home graceful degradation via `VoltTheme.Home` (mock branches removed; live-only)
- [x] Volt PDP via `VoltTheme.PDP` (`preview/volt/_pdp-live.tsx`) — themed product + add-to-cart + related
- [x] `VoltTheme` assembled (`preview/volt/_theme.tsx`) and registered in `lib/themes/index.ts`
- [x] Route files (`/`, `/shop`, `/deals`, `/products/[handle]`) switched to `getTheme(...)`; home keeps a legacy `switch` only for not-yet-ported themes
- [~] Volt Cart / Checkout / Order — **delegate to `DefaultTheme` for now**; themed in Phase 2
- Verify: `tsc` + `next build` green; `tests/views-merchandising.test.ts` (6 cases) green via `pnpm test`.

### Phase 2 — Theme the shared functional routes ✅ DONE

- [x] `/products/[handle]` renders `Theme.PDP` (done in Phase 1)
- [x] `/cart` renders `Theme.Cart`
- [x] `/checkout` renders `Theme.Checkout` (Razorpay + shipping server actions intact)
- [x] `/order/[id]` renders `Theme.Order`
- [x] Nav/Footer come from the active theme on every functional route
- Approach: shared theme-agnostic client components carry the forms + server
  actions once (`components/storefront/cart-contents.tsx`, `checkout-flow.tsx`,
  `order-summary.tsx`); each theme wraps them in its chrome (Volt via
  `preview/volt/_functional-live.tsx`). Form-field/action parity verified.
- Verify: `tsc` + `next build` + tests green; field-name parity grep clean.

### Phase 3 — Wire the missing Medusa concepts ✅ DONE (categories); deals reframed

- [x] Real **deal detection** from price `original_amount` vs `calculated_amount` — `merchandising.ts`
- [x] **Real categories** — product fetch carries the Medusa `categories` relation;
  `resolveCategories()` uses real categories when present, else falls back to tags;
  `/shop?category=` filters by real category id **or** tag id (`filterByCategory`).
  Verified against live data: cloth tenant has 0 categories → falls back to tags;
  wiring activates automatically once a seller assigns categories.
- [x] Product fetch carries `created_at`, `tags`, `categories`, `collection`, `original_amount` — `lib/medusa/products.ts`
- [x] **Real collections** surfaced in the browse nav. Product fetch carries the
  Medusa `collection` relation; `getProductCollections()` derives seller-curated
  collections ("New Arrival", "Best seller") and `resolveCategories()` prepends them
  to the category/tag list so they show as filter chips on **Home + Shop** through the
  existing `categories` prop — **no new theme slot**. `/shop?category=<collection_id>`
  filters by collection membership (`productsInCategoryOrTag` matches category **or**
  collection **or** tag id). Verified against live data (tenant `1ff9f60…`: New Arrival
  = 5 products, Best seller = 2).
- [n/a] ~~`getPromotions(tenant)` → time-limited deals~~ — **Medusa promotions are
  cart-level**, not a browseable store endpoint. Browseable "deals" = sale prices
  (price lists), already detected. A merchant "Sale" can be modelled as a category.
- [ ] (optional / deferred) dedicated `app/collections/[handle]` landing route +
  `Theme.Collection` slot — collections are now navigable via `/shop?category=`; a
  bespoke per-collection landing page would add a slot every theme must implement.
  (adds a slot every theme must implement).

### Phase 4 — Port remaining live themes

- [x] Glow (live: Ticket Store) — all 9 slots via `GlowTheme` (`preview/glow/_theme.tsx`); registered; removed from the home `switch`. Live nav/PDP-linking cards; mock skincare-product sections dropped, decorative chrome kept.
- [x] `DefaultTheme` for tenants with `template_id = null` (e.g. flyr) — fallback in place since Phase 0
- [x] Thread, Aurum, Eventpass — all 9 slots each via `ThreadTheme`/`AurumTheme`/`EventpassTheme`
  (`preview/<t>/{_live,_shop-live,_pdp-live,_deals-live,_functional-live,_theme}.tsx`),
  view-model driven, real server actions (address/shipping/place-order/Razorpay) +
  `AddToCart`. Registered; the home `switch` is **removed entirely** — every template
  now routes through `getTheme()`. Eventpass maps `ProductView → event` (no event VM;
  date/venue placeholders dropped). PDPs use the real `AddToCart` (mock size/colour/
  ticket-tier state removed); checkouts use the real server-action flow, not the
  preview's mock `router.push` wizard.

### Phase 5 — Demote `/preview/*` to preview-only ✅ DONE (isolation locked)

Reframed from the original intent: `/preview/*` is the **seller onboarding showcase**
(static dummy data, by design — `templates.ts` `preview_path` → admin iframe). The
goal is not to rebuild it but to **guarantee the buyer (live) path never touches it**
— that was the original bug (live nav → `/preview/volt/deals`).

- [x] Audited all live buyer-path render files (volt + glow slots, shared functional
  components, DefaultTheme): **zero `/preview/` URLs**. Buyers only ever hit live routes.
- [x] Regression guard: `tests/live-path-isolation.test.ts` fails if any live-path
  file links to `/preview/`, and checks the file list stays in sync with the registry.
- [keep] Static `/preview/<t>/*` pages retained intentionally as the onboarding
  preview; they are not buyer-reachable (no live route or live slot links to them).
- [x] All five themes (volt/glow/thread/aurum/eventpass) are now ported; the isolation
  test covers every live slot file and the registry-sync check asserts all five. No
  live render file links to `/preview/*`.

### Phase 6 — Data integrity & guarantees (import)

- [x] Kids-tag drop — **self-healed**. Verified live: all 50 products tagged
  (kids 17/17, men 17/17, women 16/16), still exactly 50 products after two
  imports. The custom import (`apps/medusa/src/modules/selfkart-product-import`,
  `product-imports/{prepare,complete}` routes) is **idempotent**: products upsert
  by handle, taxonomy upserts, tag/category links are existence-checked. A first-run
  partial link-miss (product-by-handle not found at link time) self-heals on
  re-import. Guidance: if links < expected, re-run the import.
- [x] **Categories importable by name** — `extractSellerImportSeeds` now derives a
  category id from `Category Name`/`Category Handle` when `Category Id` is absent,
  so a plain `Category Name` column is enough (parent via `Parent Category Name`).
  Template: `outputs/product-import-template-with-categories.csv`.
- [x] **Duplicate-import visibility** — `prepare` now reports `existing_products` /
  `new_products` (handles already present → updated, not duplicated); the admin
  Product Upload page shows this + a "stock was reset" note.
- [x] **Inventory items labelled by product, not "Default"** — Medusa's core import
  names every inventory item after the *variant* title, so single-variant products
  showed "Default" in the admin Inventory list and multi-variant ones showed a bare
  option value ("M", "200 ml"). The post-import heal now backfills product-aware titles
  (`ensureInventoryItemTitles` in `seed-tenant-inventory-resources.ts`, called from the
  `complete` route): single/unnamed variant → `<Product Title>`, real variant title →
  `<Product Title> - <Variant Title>`. Idempotent + tenant-scoped. Applied to existing
  live data (192 items relabelled; 0 "Default" remain). Stock itself was always created
  (levels exist) — this was purely a labelling bug.
- [ ] (optional) Hard-block re-import behind an "allow updates" toggle
- [ ] Document promotions reality (cart-level) + categories setup for sellers

## 5. Progress log

- 2026-06-21 — Architecture agreed (one router / many skins). Interim Volt
  `/shop`, `/deals`, graceful home, shared product fields + `merchandising.ts`
  landed and build-green; to be refactored into the registry in Phase 1.
- 2026-06-21 — **Phase 0 done.** `lib/views/` (ProductView, CategoryView,
  CartView alias, VariantView + mappers), `lib/themes/types.ts` (StoreTheme
  contract), `lib/themes/index.ts` (registry + `getTheme`), `lib/themes/default.tsx`
  (DefaultTheme implementing all slots). Additive; `tsc` + `next build` green.
- 2026-06-21 — **Phase 1 done (catalog slots).** Volt ported into `VoltTheme`
  (Home/Shop/PDP/Deals/Nav/Footer) consuming view models; registered in the
  registry. Routes `/`, `/shop`, `/deals`, `/products/[handle]` render via
  `getTheme()`. PDP is now Volt-themed (was bare HTML). Cart/Checkout/Order
  delegate to DefaultTheme pending Phase 2. Added `tests/views-merchandising.test.ts`
  (data-seam coverage) + `pnpm test`; excluded `tests/` from `tsc`. `tsc` + `next
  build` + tests all green. Other templates (glow/thread/aurum/eventpass) still
  use legacy live components via the home `switch`.
- 2026-06-21 — **Phase 2 done.** Functional flow themed: `/cart`, `/checkout`,
  `/order/[id]` now render via `getTheme()`. Shared client components
  (`components/storefront/{cart-contents,checkout-flow,order-summary}.tsx`) hold
  the forms + server actions (Razorpay + shipping untouched); themes wrap them in
  chrome. DefaultTheme + VoltTheme fully implement all 9 slots. Routes thinned to
  fetch→props→`Theme.Slot`. Form-field/action parity verified; `tsc`, `next build`
  and tests all green. **The whole Volt buyer journey is now themed end-to-end.**
- 2026-06-21 — **Phase 4 (glow) done.** `GlowTheme` implements all 9 slots
  (`preview/glow/{_live,_shop-live,_deals-live,_pdp-live,_functional-live,_theme}.tsx`),
  view-model driven, with a live nav + PDP-linking cards; mock skincare-product
  sections (FeaturedCollections, SkinConcernFinder) dropped, decorative chrome
  kept. Registered in the registry; removed from the home `switch`. Both live
  templates (volt + glow) now run fully through `getTheme()`. Only thread/aurum/
  eventpass remain on the legacy switch (no tenants). `tsc` + `next build` +
  tests green; no `/preview` links leak into glow's live slots.
- 2026-06-21 — **Phase 3 done (categories).** Product fetch now carries the real
  Medusa `categories` relation; `resolveCategories()` prefers real categories and
  falls back to tags; `/shop` filters by category-or-tag id (`filterByCategory`).
  Promotions reframed as cart-level (no browse endpoint) — deals stay sale-price
  driven. Added 2 merchandising tests (11 total). Verified against live DB: 0
  categories on the cloth tenant → tag fallback active, wiring lights up when
  categories are assigned. `tsc` + `next build` + tests green. Done out of order
  (after Phase 4) because glow was a live tenant with immediate payoff; now closed.
- 2026-06-21 — **Phase 5 done (isolation locked).** Audited every live buyer-path
  render file (volt + glow slots, shared functional components, DefaultTheme): zero
  `/preview/` URLs — buyers only hit live routes. Added `tests/live-path-isolation.test.ts`
  as a regression guard (13 tests total). Static `/preview/*` kept intentionally as
  the onboarding showcase. `tsc` + tests green (no src change needed — Phases 1–4
  had already made the live path clean; this proves and locks it).
- 2026-06-21 — **Phase 6 (import) done.** Verified the kids-tag drop self-healed
  (live: all 50 tagged, still 50 products after 2 imports → import is idempotent).
  Backend (`apps/medusa`): categories now importable by `Category Name` alone
  (`taxonomy.ts`); `prepare` route reports existing-vs-new product handles; admin
  Product Upload page shows it + a stock-reset note. Added
  `outputs/product-import-template-with-categories.csv`. `apps/medusa` `tsc` green.

- 2026-06-21 — **Phase 4 complete (thread / aurum / eventpass).** All three ported to
  full `StoreTheme` implementations (9 slots each) following the volt/glow "best of
  both" pattern: the template's visual language fed real Medusa view models + wired to
  the real server actions (`setAddressAction`/`setShippingMethodAction`/`placeOrderAction`/
  Razorpay) and `AddToCart`. Registered in `lib/themes/index.ts`; the home `switch` and
  its legacy `*LivePage(config, products)` imports are **removed** — every template now
  renders via `getTheme()`. Styled checkout (the original ask) replaces the previews'
  mock `router.push` wizards. `live-path-isolation.test.ts` extended to cover all 15 new
  slot files + assert all five themes registered. `tsc --noEmit`, `next build`, and all
  13 tests green. Thread built inline as the reference; aurum + eventpass built by
  parallel agents against it and reviewed.

- 2026-06-22 — **Bugfix: login/account 500 on thread/aurum/eventpass.** Each theme's
  `_account-live.tsx` is a SERVER component (it composes the server-rendered
  `AccountContent`), but called a helper exported from the `"use client"` `_live.tsx`
  (`threadColorVars`/`aurumColorVars`/`pageShell`). A client-tainted function invoked
  during a server render throws ("Attempted to call …() from the server") → `/login`
  (and `/checkout`, which redirects there) 500. Home/shop/etc. were unaffected — those
  slots live *inside* the client `_live.tsx`. Fix: moved the pure helpers into plain
  (non-`"use client"`) modules (`_color-vars.ts`, eventpass `_tokens.ts`); `_live.tsx`
  re-exports them so client slots are untouched; `_account-live.tsx` imports from the
  plain module. volt/glow were already clean (account slots import only components).
  Added a regression guard (`live-path-isolation.test.ts`, 14 tests) that fails if any
  `_account-live.tsx` imports a lowercase helper from `./_live`. The bug shipped
  invisibly on aurum/eventpass (no tenants to surface it). Also: thread category cards
  now use a real product thumbnail (`CategoryView.image`) with a neutral generated
  placeholder, instead of hardcoded Unsplash apparel photos. `tsc` + `next build` +
  tests green.

## 6. Risks / open questions

- **Checkout theming** is the riskiest slot — server actions (`setAddressAction`,
  `placeOrderAction`) + Razorpay client component must stay intact while the
  shell becomes themed. Migrate last within a theme.
- **Preview demotion** must not break the seller onboarding "preview" UX.
- **Per-tenant caching**: all routes are `force-dynamic` (host-derived tenant);
  keep it that way to avoid cross-tenant leakage.
- **Non-product verticals** (eventpass): confirm generic view models cover events
  (date, venue, ticket tiers) or extend `ProductView` with optional fields.
