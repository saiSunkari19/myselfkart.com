import assert from "node:assert/strict"

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

import { runWithTenantContext } from "../modules/tenant-context"

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"
const EMAIL_A = "seller-a@selfkart.test"
const EMAIL_B = "seller-b@selfkart.test"

type UserRow = { email?: string }

/**
 * Proves Concern 2: the admin `user` table is tenant-isolated by RLS, so one
 * seller admin cannot enumerate another seller's admin users. Reads go through
 * Medusa's ORM (query.graph), which the read-path patch wraps in a transaction
 * so the tenant context is applied.
 */
export default async function assertIdentityIsolation({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  async function sellerEmailsFor(tenantId: string): Promise<string[]> {
    return runWithTenantContext({ tenantId, source: "test" }, async () => {
      const { data } = await query.graph({ entity: "user", fields: ["email"] })
      return (data as UserRow[])
        .map((u) => u.email)
        .filter((e): e is string => !!e && e.endsWith("@selfkart.test"))
        .sort()
    })
  }

  const tenantA = await sellerEmailsFor(TENANT_A)
  const tenantB = await sellerEmailsFor(TENANT_B)

  const { data: noContext } = await query.graph({ entity: "user", fields: ["email"] })
  const noContextCount = (noContext as UserRow[]).filter((u) =>
    u.email?.endsWith("@selfkart.test")
  ).length

  assert.deepEqual(tenantA, [EMAIL_A], "tenant A must see only its own admin user")
  assert.deepEqual(tenantB, [EMAIL_B], "tenant B must see only its own admin user")
  assert.equal(noContextCount, 0, "no-context user listing must see zero seller admins")

  logger.info(
    "IDENTITY PASS: user table RLS isolates admins (A=only A, B=only B, no-context=0)"
  )
}
