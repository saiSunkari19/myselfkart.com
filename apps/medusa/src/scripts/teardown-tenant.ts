import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { teardownTenant } from "../platform/repository"

/**
 * CLI/dev hard-delete of a tenant. `TENANT_ID` required; `FORCE=1` to delete
 * even when the tenant has orders. Mirrors the console DELETE route.
 */
export default async function teardown({ container }: ExecArgs): Promise<void> {
  const tenantId = process.env.TENANT_ID ?? ""
  const force = process.env.FORCE === "1" || process.env.FORCE === "true"
  if (!tenantId) {
    throw new Error("TENANT_ID is required")
  }
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const result = await teardownTenant(knex, tenantId, { force })
  logger.info(
    `Tenant torn down: ${result.tenantId} (orders=${result.ordersDeleted}, products=${result.productsDeleted})`
  )
}
