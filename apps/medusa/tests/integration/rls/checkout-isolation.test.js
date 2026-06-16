const { execFileSync } = require("node:child_process")
const test = require("node:test")

function requireAppDatabaseUrl() {
  const databaseUrl = process.env.APP_DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("APP_DATABASE_URL or DATABASE_URL is required for RLS integration tests")
  }

  return databaseUrl
}

function medusaExec(script) {
  execFileSync("corepack", ["pnpm", "exec", "medusa", "exec", script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: requireAppDatabaseUrl(),
    },
    stdio: "inherit",
  })
}

// Regresses Phase 1 buyer checkout-pipeline isolation. The assertion script
// throws on any breach, so `medusa exec` exits non-zero and this test fails. It
// proves two things through the pooled medusa_app role: (1) every pricing /
// fulfillment / payment checkout table is RLS-enabled, forced, and policied, and
// (2) a tenant-owned row (price_set) is visible only to its own tenant and never
// with no tenant context — so one seller can never read another seller's prices,
// shipping config, fulfillments, or payment collections.
test("checkout pipeline: pricing/fulfillment/payment tables are tenant-isolated", () => {
  medusaExec("./src/scripts/assert-checkout-isolation.ts")
})
