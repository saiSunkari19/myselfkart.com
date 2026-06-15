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

// Simulates a tenant-scoped background job: it leases a pooled connection,
// opens its own transaction, stamps the tenant context, and only then reads.
// This is the path a Medusa scheduled job/subscriber takes — it never passes
// through the HTTP tenant middleware, so it must set context itself.
async function runScopedJob(pool, tenantId) {
  const client = await pool.connect()

  try {
    await client.query("begin")
    await client.query("select set_config('app.current_tenant', $1, true)", [tenantId])

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
  } finally {
    client.release()
  }
}

// Simulates a misconfigured background job that forgot to set tenant context.
// RLS must fail safe: the job sees zero tenant-owned rows, never every tenant.
async function runUnscopedJob(pool) {
  const client = await pool.connect()

  try {
    await client.query("begin")

    const result = await client.query(
      `select count(*)::int as count from product where handle like 'selfkart-rls-%'`
    )

    await client.query("commit")
    return result.rows[0].count
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}

test("background jobs stay isolated when they set tenant context", async () => {
  seedFixtures()

  const pool = new Pool({
    connectionString: normalizePgUrl(requireAppDatabaseUrl()),
    max: 4,
    ssl: { rejectUnauthorized: false },
  })

  try {
    // A job that loops over tenants sees only the active tenant each pass,
    // even though it reuses connections from the same pool across tenants.
    for (const tenantId of [TENANT_A, TENANT_B, TENANT_A, TENANT_B]) {
      const scoped = await runScopedJob(pool, tenantId)

      assert.equal(scoped.count, 2, "scoped job must see exactly its tenant's products")
      assert.equal(
        scoped.wrong_tenant_count,
        0,
        "scoped job must never see another tenant's products"
      )
    }

    // A job that forgets context must fail safe to zero rows, not leak all.
    const unscoped = await runUnscopedJob(pool)
    assert.equal(unscoped, 0, "unscoped job must see zero tenant-owned rows")
  } finally {
    await pool.end()
  }
})
