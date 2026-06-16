const { test } = require("node:test")
const assert = require("node:assert/strict")
const { csv2json } = require("json-2-csv")
const { CSVNormalizer, productValidators } = require("@medusajs/utils")

/**
 * Regression guard for the Medusa product CSV import.
 *
 * Medusa's CSV parser (json-2-csv csv2json) runs JSON.parse on every cell by
 * default, so numeric-looking sizes like "32" arrive as the number 32. The
 * product create validators expect strings for variant titles and option
 * values, so without normalization the import fails with:
 *   "expected string, received number" at variants[].title /
 *   variants[].options.<name> / options[].values[].
 *
 * The fix lives in the @medusajs/utils patch (CSVNormalizer: processAsString
 * and the variant-option processor coerce values back to String). This test
 * exercises the exact import step — convertCsvToJson -> CSVNormalizer ->
 * productValidators.CreateProduct.parse — so a lost patch fails here instead
 * of breaking the seller import UI at runtime.
 */

// Mirrors core-flows convertCsvToJson(): csv2json with default value parsing.
function normalize(csv) {
  const rows = csv2json(csv, {
    preventCsvInjection: true,
    delimiter: { field: "," },
  })
  const normalizer = new CSVNormalizer(
    rows.map((row, index) => CSVNormalizer.preProcess(row, index + 1))
  )
  const products = normalizer.proccess()
  return Object.keys(products.toCreate).map((handle) =>
    productValidators.CreateProduct.parse(products.toCreate[handle])
  )
}

const CSV = [
  "Product Handle,Product Title,Product Status,Variant Title,Variant SKU,Variant Price USD,Variant Option 1 Name,Variant Option 1 Value",
  // Purely numeric size — the case that regressed (coerced to number 32).
  "men-slim-chino-pants,Men Slim Chino Pants,published,32,MEN-020-32,58,Size,32",
  // Alphanumeric size — always passed; included to prove the fix is non-destructive.
  "men-classic-crew-t-shirt,Men Classic Crew T-Shirt,published,M,MEN-018-M,22,Size,M",
].join("\n")

test("numeric variant titles and option values normalize to strings", () => {
  const products = normalize(CSV)
  assert.equal(products.length, 2)

  const numeric = products.find((p) => p.handle === "men-slim-chino-pants")
  assert.ok(numeric, "expected the numeric-size product")

  // variant.title
  assert.equal(typeof numeric.variants[0].title, "string")
  assert.equal(numeric.variants[0].title, "32")

  // product.options[].values[]
  assert.equal(typeof numeric.options[0].values[0], "string")
  assert.deepEqual(numeric.options[0].values, ["32"])

  // variant.options.<name>
  assert.equal(typeof numeric.variants[0].options.Size, "string")
  assert.equal(numeric.variants[0].options.Size, "32")
})

test("alphanumeric sizes are preserved unchanged", () => {
  const products = normalize(CSV)
  const alpha = products.find((p) => p.handle === "men-classic-crew-t-shirt")
  assert.ok(alpha, "expected the alphanumeric-size product")
  assert.equal(alpha.variants[0].title, "M")
  assert.deepEqual(alpha.options[0].values, ["M"])
  assert.equal(alpha.variants[0].options.Size, "M")
})
