import assert from "node:assert/strict"

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

type ProductRow = { handle?: string }

/**
 * Exercises Medusa's real read path (query.graph) under a tenant context to
 * prove the @mikro-orm/knex read-path patch makes RLS apply on reads. Without
 * the patch, query.graph runs without a transaction and RLS returns zero rows.
 */
export default async function assertReadPathIsolation({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  async function seededHandlesFor(tenantId: string): Promise<string[]> {
    return runWithTenantContext({ tenantId, source: "test" }, async () => {
      const { data } = await query.graph({ entity: "product", fields: ["handle"] })
      return (data as ProductRow[])
        .map((p) => p.handle)
        .filter((h): h is string => !!h && h.startsWith("selfkart-rls-"))
        .sort()
    })
  }

  const tenantA = await seededHandlesFor(TENANT_A)
  const tenantB = await seededHandlesFor(TENANT_B)

  // No tenant context: the patch does not wrap, RLS fail-closes to zero rows.
  const { data: noContext } = await query.graph({ entity: "product", fields: ["handle"] })
  const noContextCount = (noContext as ProductRow[]).filter(
    (p) => p.handle?.startsWith("selfkart-rls-")
  ).length

  assert.deepEqual(
    tenantA,
    ["selfkart-rls-shared", "selfkart-rls-tenant-a-only"],
    "tenant A query.graph must return only tenant A products"
  )
  assert.deepEqual(
    tenantB,
    ["selfkart-rls-shared", "selfkart-rls-tenant-b-only"],
    "tenant B query.graph must return only tenant B products"
  )
  assert.equal(
    noContextCount,
    0,
    "query.graph with no tenant context must return zero seeded products"
  )

  logger.info(
    "READ-PATH PASS: query.graph honored tenant RLS (A=2 own, B=2 own, no-context=0)"
  )
}
