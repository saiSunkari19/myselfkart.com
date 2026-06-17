const assert = require("node:assert/strict")
const test = require("node:test")

const { getStorefrontStateContent } = require("../src/lib/tenant/status-content.ts")

test("draft tenants render a coming-soon storefront state", () => {
  const content = getStorefrontStateContent("draft")

  assert.equal(content.eyebrow, "Coming soon")
  assert.equal(content.title, "This store is getting ready.")
  assert.match(content.body, /check back soon/i)
})

test("suspended tenants render an unavailable storefront state", () => {
  const content = getStorefrontStateContent("suspended")

  assert.equal(content.eyebrow, "Unavailable")
  assert.equal(content.title, "This store is temporarily unavailable.")
  assert.match(content.body, /store owner/i)
})

test("unknown tenant hosts render a safe not-found storefront state", () => {
  const content = getStorefrontStateContent("not-found")

  assert.equal(content.eyebrow, "Store not found")
  assert.equal(content.title, "We could not find this store.")
  assert.doesNotMatch(content.body, /tenant|seller|database/i)
})
