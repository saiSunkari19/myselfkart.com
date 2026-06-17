const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const test = require("node:test")

function read(path) {
  return readFileSync(path, "utf8")
}

test("tenant GET requests can reuse one RLS read transaction across Medusa reads", () => {
  const middleware = read("src/modules/tenant-context/middleware.ts")
  const store = read("src/modules/tenant-context/store.ts")
  const mikroOrmPatch = read("patches/@mikro-orm__knex@6.6.12.patch")
  const inventoryPatch = read("patches/@medusajs__inventory@2.15.5.patch")
  const pricingPatch = read("patches/@medusajs__pricing@2.15.5.patch")

  assert.match(store, /readTransaction\?/)
  assert.match(middleware, /GET/)
  assert.match(middleware, /readTransaction/)
  assert.match(mikroOrmPatch, /__sk\.readTransaction/)
  assert.match(inventoryPatch, /selfkartTenantContext\?\.readTransaction/)
  assert.match(pricingPatch, /selfkartTenantContext\?\.readTransaction/)
})
