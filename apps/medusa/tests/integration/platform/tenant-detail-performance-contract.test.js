const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const test = require("node:test")

function read(path) {
  return readFileSync(path, "utf8")
}

test("tenant detail uses one tenant-scoped operational summary query", () => {
  const repository = read("src/platform/repository.ts")
  const route = read("src/api/selfkart/platform/tenants/[id]/route.ts")

  assert.match(repository, /getTenantOperationalSummary/)
  assert.match(route, /getTenantOperationalSummary/)
  assert.doesNotMatch(route, /getTenantStats/)
  assert.doesNotMatch(route, /getTenantAdminEmail/)
})
