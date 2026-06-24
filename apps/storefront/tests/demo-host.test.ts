const assert = require("node:assert/strict")
const test = require("node:test")

// demo-host.ts is dependency-free (no server-only / next imports), so it runs
// under Node's native TS stripping like the other unit-tested lib modules.
const { normalizeHost, matchesDemoHost } = require("../src/lib/tenant/demo-host.ts")

test("normalizeHost lowercases, strips port, and takes the first forwarded value", () => {
  assert.equal(normalizeHost("Storefront.MySelfkart.com"), "storefront.myselfkart.com")
  assert.equal(normalizeHost("storefront.myselfkart.com:3000"), "storefront.myselfkart.com")
  assert.equal(normalizeHost("storefront.myselfkart.com, proxy.internal"), "storefront.myselfkart.com")
  assert.equal(normalizeHost("  cloth.myselfkart.com  "), "cloth.myselfkart.com")
  assert.equal(normalizeHost(null), "")
  assert.equal(normalizeHost(undefined), "")
})

test("matchesDemoHost matches the configured demo host (case/port/proxy-insensitive)", () => {
  const env = "storefront.myselfkart.com"
  assert.equal(matchesDemoHost("storefront.myselfkart.com", env), true)
  assert.equal(matchesDemoHost("Storefront.Myselfkart.com:3000", env), true)
  assert.equal(matchesDemoHost("storefront.myselfkart.com, cf-proxy", env), true)
})

test("matchesDemoHost rejects real tenant hosts (so the demo never shadows a store)", () => {
  assert.equal(matchesDemoHost("cloth.myselfkart.com", "storefront.myselfkart.com"), false)
  assert.equal(matchesDemoHost("launch.myselfkart.com", "storefront.myselfkart.com"), false)
})

test("matchesDemoHost supports a comma-separated allowlist", () => {
  const env = "storefront.myselfkart.com, demo.myselfkart.com"
  assert.equal(matchesDemoHost("demo.myselfkart.com", env), true)
  assert.equal(matchesDemoHost("storefront.myselfkart.com", env), true)
  assert.equal(matchesDemoHost("other.myselfkart.com", env), false)
})

test("matchesDemoHost is safe when env is unset/empty or host is empty (no demo)", () => {
  assert.equal(matchesDemoHost("storefront.myselfkart.com", undefined), false)
  assert.equal(matchesDemoHost("storefront.myselfkart.com", ""), false)
  assert.equal(matchesDemoHost("storefront.myselfkart.com", "  , "), false)
  assert.equal(matchesDemoHost("", "storefront.myselfkart.com"), false)
  assert.equal(matchesDemoHost(null, "storefront.myselfkart.com"), false)
})
