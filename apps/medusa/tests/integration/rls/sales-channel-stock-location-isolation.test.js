const { execFileSync } = require("node:child_process")
const test = require("node:test")

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

function requireAppDatabaseUrl() {
  const databaseUrl = process.env.APP_DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("APP_DATABASE_URL or DATABASE_URL is required for RLS integration tests")
  }

  return databaseUrl
}

function medusaExec(script, extraEnv = {}) {
  execFileSync("corepack", ["pnpm", "exec", "medusa", "exec", script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
      DATABASE_URL: requireAppDatabaseUrl(),
    },
    stdio: "inherit",
  })
}

test("stock locations, sales channels, and their links are isolated by tenant", () => {
  medusaExec("./src/scripts/seed-tenants.ts")
  medusaExec("./src/scripts/seed-tenant-inventory-resources.ts", {
    SELLER_ADMIN_TENANT_ID: TENANT_A,
    SELLER_NAME: "Tenant A",
    STOCKED_QUANTITY: "100",
  })
  medusaExec("./src/scripts/seed-tenant-inventory-resources.ts", {
    SELLER_ADMIN_TENANT_ID: TENANT_B,
    SELLER_NAME: "Tenant B",
    STOCKED_QUANTITY: "100",
  })
  medusaExec("./src/scripts/assert-stock-sales-isolation.ts")
})
