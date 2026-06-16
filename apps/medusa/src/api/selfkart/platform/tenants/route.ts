import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { listTenants } from "../../../../platform/repository"

/** Lists every provisioned tenant with its primary storefront host. */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const tenants = await listTenants(knex)
  res.json({ tenants })
}
