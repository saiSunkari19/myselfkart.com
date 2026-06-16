import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

type ApiKeyRow = { id?: string; title?: string }

/**
 * Proves the api_key RLS gap is closed: a seller admin can only see its own
 * publishable/secret keys, never another tenant's. Self-contained — it creates
 * one key per tenant (stamped via the RLS trigger because creation runs inside
 * the tenant context), asserts isolation through Medusa's ORM (query.graph, which
 * the read-path patch runs under app.current_tenant), then hard-deletes them.
 *
 * Run on a disposable Neon branch like the other assert-*-isolation gates:
 *   DATABASE_URL=... corepack pnpm exec medusa exec ./src/scripts/assert-api-key-isolation.ts
 */
export default async function assertApiKeyIsolation({ container }: ExecArgs): Promise<void> {
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const tag = `selfkart-apikey-assert-${randomUUID().slice(0, 8)}`
  const titleA = `${tag}-a`
  const titleB = `${tag}-b`

  // Create one key per tenant, each inside its own tenant context so the trigger
  // stamps tenant_id correctly.
  const keyA = await runWithTenantContext({ tenantId: TENANT_A, source: "test" }, () =>
    apiKeyModule.createApiKeys({ title: titleA, type: "publishable", created_by: tag })
  )
  const keyB = await runWithTenantContext({ tenantId: TENANT_B, source: "test" }, () =>
    apiKeyModule.createApiKeys({ title: titleB, type: "publishable", created_by: tag })
  )

  try {
    async function seededTitlesFor(tenantId: string): Promise<string[]> {
      return runWithTenantContext({ tenantId, source: "test" }, async () => {
        const { data } = await query.graph({ entity: "api_key", fields: ["title"] })
        return (data as ApiKeyRow[])
          .map((k) => k.title)
          .filter((t): t is string => !!t && t.startsWith(tag))
          .sort()
      })
    }

    const seenByA = await seededTitlesFor(TENANT_A)
    const seenByB = await seededTitlesFor(TENANT_B)

    const { data: noCtx } = await query.graph({ entity: "api_key", fields: ["title"] })
    const noCtxSeeded = (noCtx as ApiKeyRow[]).filter((k) => k.title?.startsWith(tag)).length

    assert.deepEqual(seenByA, [titleA], "tenant A must see only its own api key")
    assert.deepEqual(seenByB, [titleB], "tenant B must see only its own api key")
    assert.equal(noCtxSeeded, 0, "no-context api_key listing must see zero seeded keys")

    logger.info(
      "API-KEY ISOLATION PASS: api_key RLS isolates keys (A=only A, B=only B, no-context=0)"
    )
  } finally {
    // Hard-delete the throwaway keys under each tenant's context (the delete
    // policy permits a tenant to remove its own rows).
    for (const [tenantId, id] of [
      [TENANT_A, keyA.id],
      [TENANT_B, keyB.id],
    ] as const) {
      await runWithTenantContext({ tenantId, source: "test" }, async () => {
        await knex.transaction(async (trx) => {
          await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
          await trx("api_key").where({ id }).del()
        })
      })
    }
  }
}
