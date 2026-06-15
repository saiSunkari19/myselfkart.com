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

// Concern 2: the admin identity tables (user/invite/api_key) are tenant-RLS'd so
// one seller admin cannot enumerate another's. Provision two seller admins, then
// assert through Medusa's ORM that each tenant sees only its own admin user. The
// assertion script throws on any breach -> medusa exec exits non-zero -> fail.
test("admin identity (user) table is isolated by tenant", () => {
  medusaExec("./src/scripts/create-seller-admin.ts", {
    SELLER_ADMIN_TENANT_ID: TENANT_A,
    SELLER_ADMIN_EMAIL: "seller-a@selfkart.test",
    SELLER_ADMIN_PASSWORD: "Password123!",
  })
  medusaExec("./src/scripts/create-seller-admin.ts", {
    SELLER_ADMIN_TENANT_ID: TENANT_B,
    SELLER_ADMIN_EMAIL: "seller-b@selfkart.test",
    SELLER_ADMIN_PASSWORD: "Password123!",
  })
  medusaExec("./src/scripts/assert-identity-isolation.ts")
})
