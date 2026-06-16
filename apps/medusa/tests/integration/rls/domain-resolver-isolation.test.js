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

// Regresses the storefront /store* domain resolver (Phase 1). The assertion
// script throws on any breach, so `medusa exec` exits non-zero and this test
// fails. It proves two trust-critical pieces: the HMAC boundary is forge
// resistant (a browser cannot fabricate tenant context without the shared
// secret) and the platform tenants/tenant_domains registry resolves a host to
// the right tenant + publishable key, hides unknown hosts, and is readable with
// no tenant context (it runs before any context exists).
test("storefront domain resolver: HMAC boundary + tenant registry isolation", () => {
  medusaExec("./src/scripts/assert-domain-resolver.ts")
})
