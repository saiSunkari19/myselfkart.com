const assert = require("node:assert/strict")
const { execFileSync } = require("node:child_process")
const test = require("node:test")
const { Pool } = require("pg")

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

function requireRuntimeRole(role) {
  assert.notEqual(role.current_user, "neondb_owner")
  assert.equal(role.rolsuper, false)
  assert.equal(role.rolbypassrls, false)
}

async function assertRuntimeRole(pool) {
  const result = await pool.query(`
    select
      current_user,
      rolsuper,
      rolbypassrls
    from pg_roles
    where rolname = current_user
  `)

  assert.equal(result.rows.length, 1)
  requireRuntimeRole(result.rows[0])
}

async function queryTenantProducts(client, tenantId) {
  await client.query("begin")
  await client.query("select set_config('app.current_tenant', $1, true)", [tenantId])

  try {
    const result = await client.query(
      `
        select
          count(*)::int as count,
          count(*) filter (where tenant_id <> $1::uuid)::int as wrong_tenant_count
        from product
        where handle like 'selfkart-rls-%'
      `,
      [tenantId]
    )

    await client.query("commit")
    return result.rows[0]
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

async function runProbe(pool, index) {
  const tenantId = index % 2 === 0 ? TENANT_A : TENANT_B
  const client = await pool.connect()

  try {
    const result = await queryTenantProducts(client, tenantId)

    assert.equal(result.count, 2)
    assert.equal(result.wrong_tenant_count, 0)
  } finally {
    client.release()
  }
}

async function runConcurrentProbes(pool, iterations, concurrency) {
  let nextIndex = 0

  async function worker() {
    while (nextIndex < iterations) {
      const index = nextIndex
      nextIndex += 1
      await runProbe(pool, index)
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, () => worker())
  )
}

test("pooled connections do not leak tenant context under concurrency", async () => {
  const iterations = Number.parseInt(process.env.ITERATIONS || "500", 10)
  const concurrency = Number.parseInt(process.env.CONCURRENCY || "50", 10)

  assert.ok(iterations > 0, "ITERATIONS must be greater than zero")
  assert.ok(concurrency > 0, "CONCURRENCY must be greater than zero")

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

  const pool = new Pool({
    connectionString: normalizePgUrl(requireAppDatabaseUrl()),
    max: concurrency,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await assertRuntimeRole(pool)
    await runConcurrentProbes(pool, iterations, concurrency)
  } finally {
    await pool.end()
  }
})
