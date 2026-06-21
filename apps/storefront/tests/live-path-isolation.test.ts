const assert = require("node:assert/strict")
const test = require("node:test")
const fs = require("node:fs")
const path = require("node:path")

/**
 * Phase 5 guarantee: the buyer (live) render path must NEVER link to a
 * `/preview/*` URL. `/preview/*` is the seller-facing static showcase only.
 * This is exactly the bug class that started this work (the live nav linking to
 * `/preview/volt/deals`). These files produce all buyer-facing links (navs,
 * cards, footers, functional flow), so we assert none contain a `/preview/` URL.
 *
 * Unported themes (thread/aurum/eventpass) still link to `/preview/*` from their
 * legacy live components — intentionally excluded here until they are ported into
 * the registry (no tenant uses them today).
 */
const SRC = path.join(__dirname, "..", "src")

const LIVE_RENDER_FILES = [
  // Volt theme slots
  "app/preview/volt/_live.tsx",
  "app/preview/volt/_shop-live.tsx",
  "app/preview/volt/_deals-live.tsx",
  "app/preview/volt/_pdp-live.tsx",
  "app/preview/volt/_functional-live.tsx",
  "app/preview/volt/_theme.tsx",
  // Glow theme slots
  "app/preview/glow/_live.tsx",
  "app/preview/glow/_shop-live.tsx",
  "app/preview/glow/_deals-live.tsx",
  "app/preview/glow/_pdp-live.tsx",
  "app/preview/glow/_functional-live.tsx",
  "app/preview/glow/_theme.tsx",
  // Shared functional components + default theme
  "components/storefront/cart-contents.tsx",
  "components/storefront/checkout-flow.tsx",
  "components/storefront/order-summary.tsx",
  "lib/themes/default.tsx",
]

test("no live buyer-path render file links to a /preview/ URL", () => {
  const offenders = []
  for (const rel of LIVE_RENDER_FILES) {
    const src = fs.readFileSync(path.join(SRC, rel), "utf8")
    if (src.includes("/preview/")) offenders.push(rel)
  }
  assert.deepEqual(
    offenders,
    [],
    `These live-path files must use live routes, not /preview/: ${offenders.join(", ")}`
  )
})

test("the live render file list stays in sync with registered themes", () => {
  // If a new theme is registered, its slot files must be added above so the
  // isolation guarantee covers it. Volt + Glow are the registered themes today.
  const registry = fs.readFileSync(path.join(SRC, "lib/themes/index.ts"), "utf8")
  for (const id of ["volt", "glow"]) {
    assert.ok(registry.includes(`${id}:`), `${id} should be registered in the theme registry`)
    assert.ok(
      LIVE_RENDER_FILES.some(f => f.includes(`/${id}/`)),
      `${id} slot files should be covered by the isolation test`
    )
  }
})
