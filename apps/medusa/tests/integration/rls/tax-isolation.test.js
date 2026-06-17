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

// Regresses Phase 3 tax-table isolation. The assertion proves tax_region,
// tax_rate, and tax_rate_rule are RLS-enabled/forced and that two tenants can
// configure the same country independently without cross-tenant visibility.
test("tax tables are tenant-isolated", () => {
  medusaExec("./src/scripts/assert-tax-rls.ts")
})
