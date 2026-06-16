import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { listApplications } from "../../../../platform/repository"

const ALLOWED_STATUS = new Set([
  "pending",
  "approved",
  "provisioning",
  "active",
  "rejected",
  "failed",
])

/** Lists seller applications, newest first, optionally filtered by ?status=. */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const status =
    typeof req.query.status === "string" && ALLOWED_STATUS.has(req.query.status)
      ? req.query.status
      : undefined

  const applications = await listApplications(knex, { status })
  res.json({ applications })
}
