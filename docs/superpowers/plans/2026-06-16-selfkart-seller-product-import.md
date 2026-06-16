# Selfkart Seller Product Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tenant-safe seller product import wrapper that lets sellers upload a reusable CSV while Selfkart handles taxonomy preparation and post-import linking.

**Architecture:** Extract CSV/taxonomy behavior into a reusable `selfkart-product-import` helper module. Scripts and API routes call the helper under tenant context. Medusa's built-in importer remains responsible for product and variant creation.

**Tech Stack:** Medusa `2.15.5`, TypeScript, Node `node:test`, Knex/Postgres, Neon RLS.

---

### Task 1: Extract Import Helpers

**Files:**
- Create: `apps/medusa/src/modules/selfkart-product-import/csv.ts`
- Create: `apps/medusa/src/modules/selfkart-product-import/taxonomy.ts`
- Create: `apps/medusa/src/modules/selfkart-product-import/index.ts`
- Modify: `apps/medusa/src/scripts/seed-tenant-product-taxonomy.ts`
- Test: `apps/medusa/src/scripts/assert-selfkart-product-import-helpers.ts`

- [ ] **Step 1: Write helper assertion script**

Create `assert-selfkart-product-import-helpers.ts` that builds a small CSV in
memory, parses it, generates tenant A/B scoped IDs, and asserts:

```ts
assert.notEqual(scopedId(TENANT_A, "cloth-kids"), scopedId(TENANT_B, "cloth-kids"))
assert.equal(transformMedusaImportCsv(rows).includes("cloth-kids"), false)
assert.equal(seeds.collections.length, 1)
assert.equal(seeds.categories.length, 2)
```

- [ ] **Step 2: Run assertion script and verify it fails**

Run:

```sh
DATABASE_URL="$APP_DATABASE_URL" corepack pnpm exec medusa exec ./src/scripts/assert-selfkart-product-import-helpers.ts
```

Expected: fails because helper module does not exist.

- [ ] **Step 3: Implement helper module**

Move CSV parsing, ID generation, seed extraction, safe CSV rendering, taxonomy
upserts, and product linking out of `seed-tenant-product-taxonomy.ts`.

- [ ] **Step 4: Run assertion script and verify it passes**

Run the same command. Expected: script logs
`SELKART IMPORT HELPERS PASS`.

### Task 2: Add Prepare And Link Scripts

**Files:**
- Create: `apps/medusa/src/scripts/prepare-seller-product-import.ts`
- Modify: `apps/medusa/src/scripts/seed-tenant-product-taxonomy.ts`
- Test: `apps/medusa/src/scripts/assert-selfkart-product-import-helpers.ts`

- [ ] **Step 1: Add prepare script**

The prepare script reads `SELLER_PRODUCT_CSV`, writes `SELLER_PRODUCT_OUTPUT_CSV`,
and reports how many rows, collections, types, tags, and categories were parsed.

- [ ] **Step 2: Keep taxonomy script as post-import linker**

Refactor the existing taxonomy script to call the helper module and keep its
current environment variable contract.

- [ ] **Step 3: Verify TypeScript**

Run:

```sh
cd apps/medusa
corepack pnpm exec tsc --noEmit
```

Expected: exit 0.

### Task 3: Add Admin API Route

**Files:**
- Create: `apps/medusa/src/api/admin/selfkart/product-imports/prepare/route.ts`
- Create: `apps/medusa/src/api/admin/selfkart/product-imports/complete/route.ts`
- Create: `apps/medusa/src/admin/routes/seller-import/page.tsx`
- Modify: `apps/medusa/src/api/middlewares.ts`

- [ ] **Step 1: Add upload middleware**

Register `multer` memory upload for
`POST /admin/selfkart/product-imports/prepare`.

- [ ] **Step 2: Add route handlers**

Prepare route reads `req.files[0]`, parses the CSV, creates tenant-scoped
taxonomy, and returns JSON with `medusa_csv` and `summary`. Complete route links
imported products to taxonomy and creates inventory resources.

- [ ] **Step 3: Add Admin page**

Add `/app/seller-import` to let sellers upload one CSV from the Admin UI. The
page calls prepare, runs Medusa's native product import, confirms it, then calls
complete.

- [ ] **Step 4: Verify TypeScript and Admin build**

Run:

```sh
cd apps/medusa
corepack pnpm exec tsc --noEmit
corepack pnpm build
```

Expected: exit 0.

### Task 4: Docs And Verification

**Files:**
- Modify: `apps/medusa/README.md`
- Modify: `Medusa neon rls multitenant implementation plan · MD.md`

- [ ] **Step 1: Document seller flow**

Document the supported flow:

```txt
prepare seller CSV -> upload returned Medusa CSV -> run/link taxonomy -> run inventory resources
```

- [ ] **Step 2: Final checks**

Run:

```sh
cd apps/medusa
corepack pnpm exec tsc --noEmit
cd ../..
git diff --check
```

Expected: both exit 0.
