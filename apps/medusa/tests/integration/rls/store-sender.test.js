const assert = require("node:assert/strict")
const test = require("node:test")

// The sender helpers are TypeScript; transpile-only register so we exercise the
// real code (no DB needed — these are pure functions).
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node" },
})
const {
  buildStoreFrom,
  sanitizeDisplayName,
  getSendingDomain,
} = require("../../../src/lib/store-sender")

const A = "00000000-0000-0000-0000-00000000000a"
const B = "00000000-0000-0000-0000-00000000000b"

test("buildStoreFrom embeds the exact tenant id and store name", () => {
  assert.equal(
    buildStoreFrom("Skin Health", A, "myselfkart.com"),
    `"Skin Health" <store+${A}@myselfkart.com>`
  )
})

test("two tenants get disjoint senders carrying only their own id (no bleed)", () => {
  const fromA = buildStoreFrom("Store A", A, "myselfkart.com")
  const fromB = buildStoreFrom("Store B", B, "myselfkart.com")
  assert.notEqual(fromA, fromB)
  assert.ok(fromA.includes(`store+${A}@`))
  assert.ok(!fromA.includes(B))
  assert.ok(fromB.includes(`store+${B}@`))
  assert.ok(!fromB.includes(A))
})

test("display name is sanitized so it can't break/inject the header", () => {
  const from = buildStoreFrom('Evil"<x>,Co\nBcc:y', A, "myselfkart.com")
  assert.ok(!from.includes("<x>"))
  assert.ok(!from.includes("\n"))
  assert.ok(from.includes(`<store+${A}@myselfkart.com>`))
  assert.equal(sanitizeDisplayName(null), "Store")
  assert.equal(sanitizeDisplayName("   "), "Store")
})

test("missing tenant id fails closed", () => {
  assert.throws(() => buildStoreFrom("X", "", "myselfkart.com"))
})

test("getSendingDomain prefers explicit env, then RESEND_FROM domain, then apex", () => {
  const prev = {
    d: process.env.SELFKART_EMAIL_DOMAIN,
    f: process.env.RESEND_FROM,
  }
  delete process.env.SELFKART_EMAIL_DOMAIN
  process.env.RESEND_FROM = "noreply@myselfkart.com"
  assert.equal(getSendingDomain(), "myselfkart.com")
  process.env.SELFKART_EMAIL_DOMAIN = "mail.myselfkart.com"
  assert.equal(getSendingDomain(), "mail.myselfkart.com")

  if (prev.d === undefined) delete process.env.SELFKART_EMAIL_DOMAIN
  else process.env.SELFKART_EMAIL_DOMAIN = prev.d
  if (prev.f === undefined) delete process.env.RESEND_FROM
  else process.env.RESEND_FROM = prev.f
})
