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

async function lookupById(client, tenantId, table, id) {
  await client.query("begin")
  await client.query("select set_config('app.current_tenant', $1, true)", [tenantId])

  try {
    const result = await client.query(
      `select id, tenant_id::text as tenant_id from ${table} where id = $1`,
      [id]
    )
    await client.query("commit")
    return result.rows
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

async function attemptCrossTenantUpdate(client, tenantId, table, foreignId) {
  await client.query("begin")
  await client.query("select set_config('app.current_tenant', $1, true)", [tenantId])

  try {
    const result = await client.query(
      `update ${table} set updated_at = now() where id = $1`,
      [foreignId]
    )
    await client.query("commit")
    return result.rowCount
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

// Each entry pairs a tenant-owned table with the specific seeded row id that
// belongs to tenant A and the one that belongs to tenant B.
const DIRECT_LOOKUPS = [
  { table: "product", idA: "prod_selfkart_rls_a_only", idB: "prod_selfkart_rls_b_only" },
  { table: "customer", idA: "cus_selfkart_rls_a", idB: "cus_selfkart_rls_b" },
  { table: "cart", idA: "cart_selfkart_rls_a", idB: "cart_selfkart_rls_b" },
  { table: "\"order\"", idA: "order_selfkart_rls_a", idB: "order_selfkart_rls_b" },
]

test("direct lookup of a foreign tenant row returns nothing", async () => {
  seedFixtures()

  await withClient(async (client) => {
    for (const entity of DIRECT_LOOKUPS) {
      // Positive control: each tenant can fetch its own row by id.
      const ownA = await lookupById(client, TENANT_A, entity.table, entity.idA)
      const ownB = await lookupById(client, TENANT_B, entity.table, entity.idB)

      assert.equal(ownA.length, 1, `${entity.table}: tenant A must see its own row`)
      assert.equal(ownA[0].tenant_id, TENANT_A)
      assert.equal(ownB.length, 1, `${entity.table}: tenant B must see its own row`)
      assert.equal(ownB[0].tenant_id, TENANT_B)

      // Cross-tenant: looking up the other tenant's row by exact id is hidden.
      const crossA = await lookupById(client, TENANT_A, entity.table, entity.idB)
      const crossB = await lookupById(client, TENANT_B, entity.table, entity.idA)

      assert.equal(
        crossA.length,
        0,
        `${entity.table}: tenant A must not read tenant B row by id`
      )
      assert.equal(
        crossB.length,
        0,
        `${entity.table}: tenant B must not read tenant A row by id`
      )

      // Cross-tenant writes match zero rows because RLS hides the target.
      const updatedA = await attemptCrossTenantUpdate(client, TENANT_A, entity.table, entity.idB)
      const updatedB = await attemptCrossTenantUpdate(client, TENANT_B, entity.table, entity.idA)

      assert.equal(
        updatedA,
        0,
        `${entity.table}: tenant A must not update tenant B row`
      )
      assert.equal(
        updatedB,
        0,
        `${entity.table}: tenant B must not update tenant A row`
      )
    }
  })
})
