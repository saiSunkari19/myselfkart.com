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
 * All five themes (volt, glow, thread, aurum, eventpass) are now ported into the
 * registry, so every live slot file is covered below.
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
  // Thread theme slots
  "app/preview/thread/_live.tsx",
  "app/preview/thread/_shop-live.tsx",
  "app/preview/thread/_deals-live.tsx",
  "app/preview/thread/_pdp-live.tsx",
  "app/preview/thread/_functional-live.tsx",
  "app/preview/thread/_theme.tsx",
  // Aurum theme slots
  "app/preview/aurum/_live.tsx",
  "app/preview/aurum/_shop-live.tsx",
  "app/preview/aurum/_deals-live.tsx",
  "app/preview/aurum/_pdp-live.tsx",
  "app/preview/aurum/_functional-live.tsx",
  "app/preview/aurum/_theme.tsx",
  // Eventpass theme slots
  "app/preview/eventpass/_live.tsx",
  "app/preview/eventpass/_shop-live.tsx",
  "app/preview/eventpass/_deals-live.tsx",
  "app/preview/eventpass/_pdp-live.tsx",
  "app/preview/eventpass/_functional-live.tsx",
  "app/preview/eventpass/_theme.tsx",
  // Per-theme login + account slots
  "app/preview/volt/_account-live.tsx",
  "app/preview/glow/_account-live.tsx",
  "app/preview/thread/_account-live.tsx",
  "app/preview/aurum/_account-live.tsx",
  "app/preview/eventpass/_account-live.tsx",
  // Shared functional + account components + default theme
  "components/storefront/cart-contents.tsx",
  "components/storefront/checkout-flow.tsx",
  "components/storefront/order-summary.tsx",
  "components/storefront/account/login-form.tsx",
  "components/storefront/account/account-content.tsx",
  "components/storefront/account/account-shell.tsx",
  "components/storefront/account/orders-list.tsx",
  "components/storefront/account/addresses-manager.tsx",
  "components/storefront/account/saved-address-picker.tsx",
  "components/storefront/account/password-forms.tsx",
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

/**
 * A theme's `_account-live.tsx` (Login + Account slots) is a SERVER component —
 * it composes the server-rendered `AccountContent`, so it can't be `"use client"`.
 * `_live.tsx` is `"use client"`, so any lowercase (non-component) value imported
 * from it becomes a client reference; CALLING it during the server render throws
 * "Attempted to call <fn>() from the server" → /login & /account 500. Components
 * (Nav/Footer, uppercase) are fine — they're rendered, not called. Pure helpers
 * (colorVars/pageShell) must come from a plain (non-client) module instead.
 * This bug shipped invisibly on aurum/eventpass (no tenants to surface it).
 */
test("account/login server slots don't import client helpers from ./_live", () => {
  const offenders = []
  for (const id of ["volt", "glow", "thread", "aurum", "eventpass"]) {
    const rel = `app/preview/${id}/_account-live.tsx`
    const src = fs.readFileSync(path.join(SRC, rel), "utf8")
    const m = src.match(/import\s*\{([^}]*)\}\s*from\s*["']\.\/_live["']/)
    if (!m) continue
    const lowercaseImports = m[1]
      .split(",")
      .map(s => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(name => name && /^[a-z]/.test(name))
    if (lowercaseImports.length > 0) offenders.push(`${rel}: ${lowercaseImports.join(", ")}`)
  }
  assert.deepEqual(
    offenders,
    [],
    `Server account slots must import helpers (colorVars/pageShell) from a plain ` +
      `module, not the "use client" ./_live: ${offenders.join(" | ")}`
  )
})

test("the live render file list stays in sync with registered themes", () => {
  // If a new theme is registered, its slot files must be added above so the
  // isolation guarantee covers it. Volt + Glow are the registered themes today.
  const registry = fs.readFileSync(path.join(SRC, "lib/themes/index.ts"), "utf8")
  for (const id of ["volt", "glow", "thread", "aurum", "eventpass"]) {
    assert.ok(registry.includes(`${id}:`), `${id} should be registered in the theme registry`)
    assert.ok(
      LIVE_RENDER_FILES.some(f => f.includes(`/${id}/`)),
      `${id} slot files should be covered by the isolation test`
    )
  }
})
