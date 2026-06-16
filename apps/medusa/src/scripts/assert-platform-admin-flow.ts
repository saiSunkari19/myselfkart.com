import assert from "node:assert/strict"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  isValidEmail,
  isValidSubdomain,
  newId,
  normalizeSubdomain,
  RESERVED_SUBDOMAINS,
  sessionExpiry,
  verifyPassword,
} from "../platform/auth"
import {
  createSession,
  deleteSession,
  findAdminByEmail,
  findAdminBySessionToken,
  findApplicationById,
  insertAdmin,
  insertApplication,
  listApplications,
  updateApplication,
} from "../platform/repository"

/**
 * Asserts the platform-admin onboarding flow end to end, mirroring the project's
 * other assert-*.ts gates. Two layers:
 *
 *   1. Pure (no DB): credential + session + validation helpers.
 *   2. DB-backed: admin/session/application lifecycle on the platform tables.
 *      Run on a DISPOSABLE Neon branch like the RLS asserts — it writes throwaway
 *      rows (prefixed selfkart-assert-) and cleans them up.
 *
 * Run:  DATABASE_URL=... corepack pnpm exec medusa exec ./src/scripts/assert-platform-admin-flow.ts
 */
function assertPureHelpers(): void {
  // Password: correct verifies, wrong + tampered fail.
  const hash = hashPassword("Sup3r-Secret-Pass")
  assert.ok(hash.startsWith("scrypt$"), "hash is scrypt-tagged")
  assert.equal(verifyPassword("Sup3r-Secret-Pass", hash), true, "correct password verifies")
  assert.equal(verifyPassword("wrong", hash), false, "wrong password rejected")
  assert.equal(verifyPassword("Sup3r-Secret-Pass", "garbage"), false, "malformed hash rejected")

  // Two hashes of the same password differ (random salt).
  assert.notEqual(hashPassword("x"), hashPassword("x"), "salted hashes differ")

  // Session tokens: unique, hash is deterministic and not the raw token.
  const t1 = generateSessionToken()
  const t2 = generateSessionToken()
  assert.notEqual(t1, t2, "session tokens are unique")
  assert.equal(hashSessionToken(t1), hashSessionToken(t1), "token hash is deterministic")
  assert.notEqual(hashSessionToken(t1), t1, "stored hash != raw token")

  // Expiry is in the future.
  assert.ok(sessionExpiry(Date.now()).getTime() > Date.now(), "session expiry is future")

  // Validation.
  assert.equal(isValidEmail("a@b.com"), true)
  assert.equal(isValidEmail("nope"), false)
  assert.equal(isValidSubdomain("acme-store"), true)
  assert.equal(isValidSubdomain("-bad"), false)
  assert.equal(isValidSubdomain("a"), false, "single char too short")
  assert.equal(normalizeSubdomain("  Acme Store! "), "acmestore", "normalize strips non-label chars")
  assert.ok(RESERVED_SUBDOMAINS.has("admin"), "reserved set blocks admin")

  console.log("  ✓ pure helpers (password, session, validation)")
}

async function assertDbFlow(knex: Knex): Promise<void> {
  const stamp = newId("selfkart-assert")
  const email = `${stamp}@example.com`
  const subdomain = normalizeSubdomain(stamp).slice(0, 30)
  const adminId = newId("padm")
  const appId = newId("sapp")

  try {
    // Admin create + lookup.
    await insertAdmin(knex, {
      id: adminId,
      email,
      name: "Assert Operator",
      password_hash: hashPassword("Operator-Pass-123"),
      role: "operator",
    })
    const found = await findAdminByEmail(knex, email)
    assert.ok(found, "admin found by email")
    assert.equal(verifyPassword("Operator-Pass-123", found!.password_hash), true)

    // Session create -> resolve by token -> delete.
    const token = generateSessionToken()
    await createSession(knex, {
      id: newId("psess"),
      adminId: found!.id,
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiry(Date.now()),
    })
    const viaSession = await findAdminBySessionToken(knex, hashSessionToken(token))
    assert.ok(viaSession, "admin resolved via live session token")
    assert.equal(viaSession!.id, found!.id)
    await deleteSession(knex, hashSessionToken(token))
    const afterLogout = await findAdminBySessionToken(knex, hashSessionToken(token))
    assert.equal(afterLogout, undefined, "session gone after logout")

    // Application lifecycle: insert (pending) -> provisioning -> active.
    await insertApplication(knex, {
      id: appId,
      storeName: "Assert Store",
      ownerName: "Assert Owner",
      ownerEmail: email,
      desiredSubdomain: subdomain,
      country: "us",
      currency: "usd",
      phone: null,
      notes: null,
    })
    const pending = await findApplicationById(knex, appId)
    assert.equal(pending!.status, "pending", "new application is pending")

    const live = await listApplications(knex, { status: "pending" })
    assert.ok(live.some((a) => a.id === appId), "pending application is listed")

    await updateApplication(knex, appId, { status: "provisioning", tenant_id: null })
    await updateApplication(knex, appId, { status: "active" })
    const active = await findApplicationById(knex, appId)
    assert.equal(active!.status, "active", "application transitions to active")

    // Subdomain unique-while-live index blocks a duplicate live application.
    await assert.rejects(
      insertApplication(knex, {
        id: newId("sapp"),
        storeName: "Dup",
        ownerName: "Dup",
        ownerEmail: `dup-${email}`,
        desiredSubdomain: subdomain,
        country: "us",
        currency: "usd",
        phone: null,
        notes: null,
      }),
      /IDX_seller_applications_subdomain_live|duplicate key/,
      "duplicate live subdomain rejected"
    )

    console.log("  ✓ DB flow (admin, session, application lifecycle, subdomain uniqueness)")
  } finally {
    // Cleanup throwaway rows regardless of assertion outcome.
    await knex("seller_applications").where("owner_email", "like", `%${stamp}%`).del().catch(() => {})
    await knex("platform_admin_sessions").where({ admin_id: adminId }).del().catch(() => {})
    await knex("platform_admins").where({ id: adminId }).del().catch(() => {})
  }
}

export default async function assertPlatformAdminFlow({ container }: ExecArgs): Promise<void> {
  console.log("Platform-admin flow assertions:")
  assertPureHelpers()

  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  await assertDbFlow(knex)

  console.log("All platform-admin assertions passed.")
}
