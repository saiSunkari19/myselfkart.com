const assert = require("node:assert/strict")
const test = require("node:test")

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node" },
})
const { renderStoreEmail } = require("../../../src/lib/email-template")

// S8: malicious store name must not break/inject the HTML
test("S8: store name is HTML-escaped (no raw script/markup)", () => {
  const { html, text } = renderStoreEmail({
    storeName: 'Evil"<script>alert(1)</script>,Co',
    heading: "Hi",
  })
  assert.ok(!html.includes("<script>"), "raw <script> must not appear")
  assert.ok(html.includes("&lt;script&gt;"), "name should be escaped")
  assert.ok(typeof text === "string" && text.length > 0)
})

// S8: a malicious row value (e.g. injected via store data) is escaped
test("S8: row label/value are escaped", () => {
  const { html } = renderStoreEmail({
    storeName: "Store",
    heading: "Hi",
    rows: [{ label: "X", value: '<img src=x onerror=alert(1)>' }],
  })
  assert.ok(!html.includes("<img src=x"), "raw img tag must not appear")
  assert.ok(html.includes("&lt;img"), "value should be escaped")
})

// S23: primaryColor is validated, not interpolated raw (no CSS/style injection)
test("S23: invalid primaryColor is rejected, falls back to default", () => {
  const { html } = renderStoreEmail({
    storeName: "Store",
    heading: "Hi",
    primaryColor: "red;}</style><script>x",
    button: { label: "Go", url: "https://x.test" },
  })
  assert.ok(!html.includes("</style>"), "must not inject style breakout")
  assert.ok(!html.includes("<script>x"), "must not inject script")
  assert.ok(html.includes("#111827"), "falls back to default color")
})

// S23b: a valid hex color is honored
test("S23b: valid hex primaryColor is used", () => {
  const { html } = renderStoreEmail({
    storeName: "Store",
    heading: "Hi",
    primaryColor: "#7C3AED",
    button: { label: "Go", url: "https://x.test" },
  })
  assert.ok(html.includes("#7C3AED"))
})

// S18: a base64url temp password renders verbatim (not mangled) and the button URL is present
test("S18: temp password + URL survive rendering intact", () => {
  const pw = "orP2EeYvUnM44o_xx-d"
  const { html, text } = renderStoreEmail({
    storeName: "Selfkart",
    heading: "Your store is ready",
    rows: [{ label: "Temporary password", value: pw }],
    button: { label: "Open admin", url: "https://api.myselfkart.com/app" },
  })
  assert.ok(html.includes(pw), "password must appear verbatim in html")
  assert.ok(text.includes(pw), "password must appear in text alternative")
  assert.ok(html.includes("https://api.myselfkart.com/app"), "button url present")
})

// Structure: html + plain-text alternative always produced
test("renderStoreEmail always returns html + non-empty text", () => {
  const { html, text } = renderStoreEmail({ storeName: "S", heading: "H", intro: "I" })
  assert.ok(html.startsWith("<!doctype html>"))
  assert.ok(text.includes("H") && text.includes("I"))
})
