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

async function scopedRows(client, tenantId, sql, params = []) {
  await client.query("begin")
  await client.query("select set_config('app.current_tenant', $1, true)", [tenantId])

  try {
    const result = await client.query(sql, params)
    await client.query("commit")
    return result.rows
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

function seedFixtures() {
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
}

// Each entry maps a tenant-owned commerce table to the seed marker used to
// isolate Phase 0B fixtures from any other rows already in the branch.
const COMMERCE_ENTITIES = [
  {
    table: "customer",
    filter: "email like 'tenant-%@example.selfkart.test'",
    idA: "cus_selfkart_rls_a",
    idB: "cus_selfkart_rls_b",
  },
  {
    table: "cart",
    filter: "id like 'cart_selfkart_rls_%'",
    idA: "cart_selfkart_rls_a",
    idB: "cart_selfkart_rls_b",
  },
  {
    table: "\"order\"",
    filter: "id like 'order_selfkart_rls_%'",
    idA: "order_selfkart_rls_a",
    idB: "order_selfkart_rls_b",
  },
]

test("seeded cart/customer/order are isolated by tenant", async () => {
  seedFixtures()

  await withClient(async (client) => {
    for (const entity of COMMERCE_ENTITIES) {
      const listSql = `
        select id, tenant_id::text as tenant_id
        from ${entity.table}
        where ${entity.filter}
        order by id
      `

      const tenantARows = await scopedRows(client, TENANT_A, listSql)
      const tenantBRows = await scopedRows(client, TENANT_B, listSql)
      const noContext = await client.query(
        `select count(*)::int as count from ${entity.table} where ${entity.filter}`
      )

      assert.equal(
        tenantARows.length,
        1,
        `${entity.table}: tenant A should see exactly one seeded row`
      )
      assert.equal(
        tenantBRows.length,
        1,
        `${entity.table}: tenant B should see exactly one seeded row`
      )
      assert.equal(
        noContext.rows[0].count,
        0,
        `${entity.table}: no tenant context must see zero rows`
      )

      assert.equal(tenantARows[0].id, entity.idA)
      assert.equal(tenantARows[0].tenant_id, TENANT_A)
      assert.equal(tenantBRows[0].id, entity.idB)
      assert.equal(tenantBRows[0].tenant_id, TENANT_B)
    }
  })
})
