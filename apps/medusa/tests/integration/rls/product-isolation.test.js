const assert = require("node:assert/strict")
const { execFileSync } = require("node:child_process")
const test = require("node:test")
const { Client } = require("pg")

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

function requireAppDatabaseUrl() {
  const databaseUrl = process.env.APP_DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("APP_DATABASE_URL or DATABASE_URL is required for RLS integration tests")
  }

  return databaseUrl
}

function normalizePgUrl(rawUrl) {
  const url = new URL(rawUrl)
  url.searchParams.delete("pgbouncer")
  return url.toString()
}

async function withClient(callback) {
  const client = new Client({
    connectionString: normalizePgUrl(requireAppDatabaseUrl()),
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    return await callback(client)
  } finally {
    await client.end()
  }
}

async function queryProducts(client, tenantId) {
  await client.query("begin")
  await client.query("select set_config('app.current_tenant', $1, true)", [tenantId])

  try {
    const result = await client.query(
      `
        select id, handle, tenant_id::text as tenant_id
        from product
        where handle like 'selfkart-rls-%'
        order by handle
      `
    )

    await client.query("commit")
    return result.rows
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

test("seeded products are isolated by tenant", async () => {
  execFileSync(
    "corepack",
    ["pnpm", "exec", "medusa", "exec", "./src/scripts/seed-tenants.ts"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: requireAppDatabaseUrl(),
      },
      stdio: "inherit",
    }
  )

  await withClient(async (client) => {
    const tenantAProducts = await queryProducts(client, TENANT_A)
    const tenantBProducts = await queryProducts(client, TENANT_B)
    const noContext = await client.query(
      "select count(*)::int as count from product where handle like 'selfkart-rls-%'"
    )

    assert.equal(tenantAProducts.length, 2)
    assert.equal(tenantBProducts.length, 2)
    assert.equal(noContext.rows[0].count, 0)

    assert.deepEqual(
      tenantAProducts.map((product) => product.handle),
      ["selfkart-rls-shared", "selfkart-rls-tenant-a-only"]
    )
    assert.deepEqual(
      tenantBProducts.map((product) => product.handle),
      ["selfkart-rls-shared", "selfkart-rls-tenant-b-only"]
    )

    assert.ok(tenantAProducts.every((product) => product.tenant_id === TENANT_A))
    assert.ok(tenantBProducts.every((product) => product.tenant_id === TENANT_B))
  })
})
