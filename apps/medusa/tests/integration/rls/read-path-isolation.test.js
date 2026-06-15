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

// Exercises Medusa's real ORM read path (query.graph), not just raw SQL. The
// assertion script throws on any isolation breach, so medusa exec exits non-zero
// and execFileSync makes this test fail. This regresses the @mikro-orm/knex
// read-path patch: without it, query.graph runs without a transaction and RLS
// fail-closes to zero rows, breaking the tenant-A/tenant-B assertions.
test("Medusa read path (query.graph) honors tenant RLS through the pooled role", () => {
  medusaExec("./src/scripts/seed-tenants.ts")
  medusaExec("./src/scripts/assert-read-path-isolation.ts")
})
