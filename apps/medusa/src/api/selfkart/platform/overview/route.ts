import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  dashboardCounts,
  listApplications,
  listTenants,
} from "../../../../platform/repository"

/** One-shot dashboard payload: headline counts + recent applications/tenants. */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const [counts, applications, tenants] = await Promise.all([
    dashboardCounts(knex),
    listApplications(knex),
    listTenants(knex),
  ])

  res.json({
    counts,
    recentApplications: applications.slice(0, 5),
    recentTenants: tenants.slice(0, 5),
  })
}
