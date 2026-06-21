# Storefront Themes — Authoring Playbook

> The base reference for **adding a new design** or **adding a feature across
> existing designs**. If you're an agent or a new contributor, read this first.
> Architecture rationale + migration status live in
> [`themed-routes-architecture.md`](./themed-routes-architecture.md).

---

## 1. Mental model (read this once)

```
ROUTE (url + data)  →  ONE per page, identical for every design
DATA  (Medusa)      →  fetched once, in the route, via the shared data layer
THEME (design)      →  a per-template component that renders the data as props
```

Three hard rules that everything else follows from:

1. **A theme never fetches data.** It receives theme-agnostic **view models** as
   props and renders them. No `getTenantMedusa`, no `fetch`, no DB in a theme.
2. **A route never contains design.** It resolves the tenant, calls the shared
   data layer, and hands view models to `getTheme(template_id).<Slot>`.
3. **Never fabricate data.** If a section has no backing data, hide it
   (graceful degradation). See §6.

```
Request → resolveTenant() → shared data layer (Medusa) → view models → getTheme(id).Slot(props)
```

## 2. The directory map

```
src/
  app/
    page.tsx                    # Home route        → Theme.Home
    shop/page.tsx               # Listing route      → Theme.Shop
    products/[handle]/page.tsx  # PDP route          → Theme.PDP
    cart/page.tsx               # Cart route         → Theme.Cart
    checkout/page.tsx           # Checkout route     → Theme.Checkout
    deals/page.tsx              # Deals route        → Theme.Deals
    order/[id]/page.tsx         # Order route        → Theme.Order
    preview/<template>/         # PREVIEW ONLY (mock data). Never a buyer path.
  lib/
    themes/
      types.ts                  # StoreTheme interface + per-slot prop types
      index.ts                  # registry: { volt, glow, ... } + getTheme()
      <template>/               # one folder per theme implementing StoreTheme
    views/                      # view-model types + Medusa→view mappers (the seam)
    medusa/                     # shared data layer (products, cart, region, payment…)
    merchandising.ts            # graceful-degradation derivations (deals/new/categories)
```

## 3. The `StoreTheme` contract

Every theme implements the same interface. Props are **shared and
theme-agnostic** — they carry Medusa-derived view models, never design.

```ts
// lib/themes/types.ts
export interface StoreTheme {
  Home(p: HomeProps): ReactNode
  Shop(p: ShopProps): ReactNode
  PDP(p: PdpProps): ReactNode
  Cart(p: CartProps): ReactNode
  Checkout(p: CheckoutProps): ReactNode
  Deals(p: DealsProps): ReactNode
  Order(p: OrderProps): ReactNode
  Nav(p: NavProps): ReactNode
  Footer(p: FooterProps): ReactNode
}
```

```ts
// lib/themes/index.ts
export const THEMES = { volt, glow, thread, aurum, eventpass } satisfies Record<string, StoreTheme>
export const getTheme = (id?: string | null): StoreTheme => THEMES[id ?? ""] ?? DefaultTheme
```

---

## 4. HOW TO: add a NEW THEME

Goal: a new design (`<name>`) that works on **every existing route** with **zero
route or data changes**.

1. **Scaffold** `lib/themes/<name>/` with one file per slot (or grouped). Copy
   the closest existing theme as a starting point.
2. **Implement every slot** of `StoreTheme`. Each slot is pure: props in, JSX out.
   - Use the view models already passed in (`ProductView`, `CartView`, …).
   - Pull brand colours/fonts from `config` (already on props) — do not hardcode.
3. **Register it**: add `<name>` to `THEMES` in `lib/themes/index.ts`.
   - The compiler will error until all slots exist — that's your checklist.
4. **Preview**: ensure `app/preview/<name>/` renders `Theme.Home` with **mock**
   view models so sellers can see it before selecting.
5. **Verify**: `npx tsc --noEmit` and `npx next build` green; click through a
   live tenant set to this theme (or a preview) for Home → Shop → PDP → Cart →
   Checkout.
6. **Update** [`themed-routes-architecture.md`](./themed-routes-architecture.md)
   Phase 4 todos.

**Checklist**

- [ ] `lib/themes/<name>/` implements all `StoreTheme` slots
- [ ] Registered in `THEMES`; `tsc` green
- [ ] Reads colours/fonts/logo from `config`, no hardcoded brand
- [ ] Graceful degradation honoured (no fake deals/bestsellers/brands)
- [ ] Preview route renders with mock data
- [ ] `next build` green; manual click-through done
- [ ] Architecture doc Phase 4 updated

---

## 5. HOW TO: add a NEW FEATURE across themes

There are exactly two shapes.

### (a) Feature is a new PAGE (e.g. `/wishlist`, `/deals`)

1. **Route once**: add `app/<feature>/page.tsx` — resolve tenant, fetch via the
   shared data layer, hand view models to `getTheme(id).<Slot>`.
2. **Data once**: add the fetch + view-model mapper in `lib/medusa/` + `lib/views/`.
3. **Contract**: add `<Slot>(p: <Slot>Props)` to `StoreTheme` in `types.ts`.
4. **Compiler lists the gaps**: every theme now fails to compile until it
   implements `<Slot>`. Implement the *design* per theme; route + data are done.
5. Update architecture doc.

### (b) Feature is a cross-cutting FIELD on existing pages (e.g. limited-time promo badge / countdown)

1. **Extend the view model once**: e.g. `ProductView.promotion: { endsAt, percentOff } | null`.
2. **Populate once** in the shared mapper (from Medusa Promotions / price lists).
3. It now flows to every theme's `PDP` / `ProductCard` via props automatically.
4. Each theme decides how (or whether) to render it. The **data exists for all,
   fetched once.**

> Rule of thumb: **wire Medusa + routing once, repeat only the visual.** If you
> find yourself editing data-fetching in more than one place for one feature,
> stop — it belongs in the shared layer.

**Checklist**

- [ ] Data + view-model change made **once** in `lib/medusa` / `lib/views`
- [ ] New page → new `StoreTheme` slot; `tsc` lists every theme to update
- [ ] Cross-cutting → new optional view-model field, populated once
- [ ] Each theme renders (or ignores) it; graceful when absent
- [ ] `next build` green; architecture doc updated

---

## 6. Graceful degradation (mandatory)

A plain product upload carries **products** — not "deals", "best sellers",
"brands", or "categories". Those are merchandising concepts with their own data
sources. Derive what's truthful; hide the rest.

| Section | Real source | If missing |
|---|---|---|
| All products / Shop | product list | always available |
| New arrivals | `product.created_at` | always derivable |
| Deals | Promotions / sale price (`original_amount` > `calculated_amount`) | **hide section + nav link** |
| Categories | Medusa Categories / product tags | hide nav, show "All" |
| Best sellers | order/sales history | **hide** (no sales yet) |
| Brands | brand data | **hide** |

Helpers live in [`lib/merchandising.ts`](../src/lib/merchandising.ts):
`getDeals`, `getNewArrivals`, `getCategories`, `isOnSale`, `discountPercent`.
**Never** fill a "Deals"/"Best Sellers" section with arbitrary product slices.

## 7. The data layer & tenant isolation

- All Medusa access goes through `lib/medusa/*` using `getTenantMedusa(tenant)`,
  which attaches the **publishable key** (sales-channel scoping) + **signed RLS
  headers**. A store can only ever read its own data — themes inherit this.
- Always `resolveTenant()` at the top of a route; gate on `tenant.status`
  (`not-found` / `draft` / `suspended`) before fetching.
- Keep every storefront route `export const dynamic = "force-dynamic"` — the
  tenant is derived per-request from the Host header; static caching would leak
  across tenants.
- Prices from `calculated_price` are in **major units** (e.g. `49.99`) — render
  directly, never divide by 100. Pass `region_id` so Medusa resolves currency.

## 7b. Live vs preview (hard rule)

`/preview/<template>/*` is the **seller onboarding showcase only** — static dummy
data, rendered in the admin iframe (`templates.ts` `preview_path`). It is never
part of a buyer's path.

- A **live theme slot** (Home/Shop/PDP/Cart/Checkout/Order/Nav/Footer) must link
  only to **live routes** (`/`, `/shop`, `/deals`, `/products/...`, `/cart`,
  `/checkout`) — **never** to a `/preview/...` URL. This is exactly the bug that
  started this work (a live nav linked to `/preview/volt/deals`).
- `tests/live-path-isolation.test.ts` enforces this: it fails if any live-path
  render file contains a `/preview/` URL. When you register a new theme, add its
  slot files to that test's `LIVE_RENDER_FILES`.

## 8. Conventions & gotchas

- Themes are `"use client"` only where they need interactivity; data arrives as
  props from a server route.
- Use markdown links for code refs in PRs/docs (clickable): `[file](path)`.
- `next/navigation` `searchParams` is a **Promise** (Next 16) — `await` it.
- Don't import mock `_data.ts` into live theme paths; mock data is preview-only.
- When you bound coverage (top-N, no retry), say so in the UI/logs — silent
  truncation reads as "complete" when it isn't.

## 9. Definition of done (any theme/feature change)

- [ ] `npx tsc --noEmit` green
- [ ] `npx next build` green
- [ ] Graceful degradation verified (no fabricated sections)
- [ ] Tenant isolation preserved (`force-dynamic`, `getTenantMedusa`)
- [ ] [`themed-routes-architecture.md`](./themed-routes-architecture.md) todos updated
