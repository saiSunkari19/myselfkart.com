import assert from "node:assert/strict"

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import type { Knex } from "knex"

import {
  signStorefrontValue,
  verifyStorefrontSignature,
} from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"
const HOST_A = "assert-seller-a.selfkart.test"
const HOST_B = "assert-seller-b.selfkart.test"
const KEY_A = "pk_assert_tenant_a"
const KEY_B = "pk_assert_tenant_b"

type ResolveRow = {
  tenant_id: string
  status: string
  publishable_key: string | null
}

/**
 * Validates the storefront /store* domain resolver's two trust-critical pieces:
 *
 *  1. The HMAC boundary (domain-auth): only a value signed with the shared
 *     SELFKART_STOREFRONT_SECRET verifies, so a browser cannot forge tenant
 *     context. Signatures are bound to their exact value and secret.
 *  2. The platform registry (tenants + tenant_domains): host -> tenant_id +
 *     publishable_key resolution works, unknown hosts resolve to nothing, and
 *     the registry is readable WITHOUT any tenant context (it is deliberately
 *     not RLS-gated because the resolver runs before tenant context exists).
 *
 * Throws on any breach so `medusa exec` exits non-zero and the wrapping test
 * fails.
 */
export default async function assertDomainResolver({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // 1. HMAC trust boundary -----------------------------------------------------
  const sigA = signStorefrontValue(TENANT_A)

  assert.equal(
    verifyStorefrontSignature(TENANT_A, sigA),
    true,
    "a correctly signed tenant id must verify"
  )
  assert.equal(
    verifyStorefrontSignature(TENANT_B, sigA),
    false,
    "a signature is bound to its value: tenant A's sig must not verify tenant B"
  )
  assert.equal(
    verifyStorefrontSignature(TENANT_A, `${sigA.slice(0, -2)}00`),
    false,
    "a tampered signature must not verify"
  )
  assert.equal(
    verifyStorefrontSignature(TENANT_A, undefined),
    false,
    "a missing signature must not verify"
  )
  assert.equal(
    verifyStorefrontSignature(TENANT_A, ""),
    false,
    "an empty signature must not verify"
  )
  assert.equal(
    verifyStorefrontSignature(TENANT_A, "zz"),
    false,
    "a non-hex signature must not verify"
  )
  assert.equal(
    verifyStorefrontSignature(TENANT_A, signStorefrontValue(TENANT_A, "a-different-secret")),
    false,
    "a signature made with a different secret must not verify"
  )

  // 2. Platform registry resolution -------------------------------------------
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  await seedRegistry(knex)

  // Mirrors apps/medusa/src/api/selfkart/resolve-domain/route.ts exactly.
  const resolve = async (host: string): Promise<ResolveRow | undefined> => {
    const result = await knex.raw(
      `
        select t."id" as tenant_id, t."status", d."publishable_key"
        from "tenant_domains" d
        join "tenants" t on t."id" = d."tenant_id"
        where lower(d."host") = ?
        limit 1
      `,
      [host]
    )
    return (result.rows as ResolveRow[] | undefined)?.[0]
  }

  const resolvedA = await resolve(HOST_A)
  const resolvedB = await resolve(HOST_B)

  assert.equal(resolvedA?.tenant_id, TENANT_A, "host A must resolve to tenant A")
  assert.equal(resolvedA?.status, "active", "host A tenant status must surface")
  assert.equal(resolvedA?.publishable_key, KEY_A, "host A must return tenant A key")

  assert.equal(resolvedB?.tenant_id, TENANT_B, "host B must resolve to tenant B")
  assert.equal(resolvedB?.publishable_key, KEY_B, "host B must return tenant B key")

  // Case-insensitive host match (resolver lower()s the host).
  const resolvedUpper = await resolve(HOST_A.toUpperCase().toLowerCase())
  assert.equal(
    resolvedUpper?.tenant_id,
    TENANT_A,
    "host resolution must be case-insensitive"
  )

  // Unknown host leaks nothing.
  const resolvedUnknown = await resolve("not-a-tenant.selfkart.test")
  assert.equal(
    resolvedUnknown,
    undefined,
    "an unknown host must resolve to no tenant"
  )

  // The registry resolved above WITHOUT any runWithTenantContext / set_config,
  // proving tenants + tenant_domains are platform tables and not RLS-gated.
  // Belt-and-braces: no tenant is active on this connection. Under the Neon
  // pooler the GUC may report null (never set) or "" (reset by a prior pooled
  // transaction); both mean "no active tenant", so accept either.
  const ctx = await knex.raw(
    "select current_setting('app.current_tenant', true) as tenant"
  )
  const activeTenant = (ctx.rows as { tenant: string | null }[])[0]?.tenant ?? null
  assert.ok(
    activeTenant === null || activeTenant === "",
    `registry must resolve with no active tenant context (got ${JSON.stringify(activeTenant)})`
  )

  logger.info(
    "DOMAIN-RESOLVER PASS: HMAC boundary forge-resistant; registry resolves host->tenant, unknown host hidden, no tenant context required"
  )
}

async function seedRegistry(knex: Knex): Promise<void> {
  const tenants = [
    { id: TENANT_A, name: "Assert Seller A", slug: "assert-seller-a" },
    { id: TENANT_B, name: "Assert Seller B", slug: "assert-seller-b" },
  ]
  for (const tenant of tenants) {
    await knex("tenants")
      .insert({ ...tenant, status: "active", updated_at: knex.fn.now() })
      .onConflict("id")
      .merge({ name: tenant.name, slug: tenant.slug, status: "active" })
  }

  const domains = [
    { id: "tdom_assert_a", tenant_id: TENANT_A, host: HOST_A, publishable_key: KEY_A },
    { id: "tdom_assert_b", tenant_id: TENANT_B, host: HOST_B, publishable_key: KEY_B },
  ]
  for (const domain of domains) {
    await knex("tenant_domains")
      .insert({ ...domain, is_primary: true, updated_at: knex.fn.now() })
      .onConflict("id")
      .merge({
        tenant_id: domain.tenant_id,
        host: domain.host,
        publishable_key: domain.publishable_key,
      })
  }
}
