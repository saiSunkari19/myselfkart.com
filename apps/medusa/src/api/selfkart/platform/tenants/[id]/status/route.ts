import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { findTenantById, updateTenantStatus } from "../../../../../../platform/repository"

/**
 * Enables or disables a tenant's storefront. Setting status to 'suspended'
 * immediately takes the store offline (useful e.g. when a seller hasn't cleared
 * invoices); 'active' brings it back. The domain resolver reads this status with
 * no caching, so the change is effective on the next request.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const id = req.params.id

  const tenant = await findTenantById(knex, id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }

  const status = (req.body as { status?: unknown })?.status
  if (status !== "active" && status !== "suspended") {
    res.status(422).json({ message: "status must be 'active' or 'suspended'" })
    return
  }

  await updateTenantStatus(knex, id, status)
  res.json({ id, status })
}
