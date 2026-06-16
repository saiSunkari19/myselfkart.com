import type { MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import type { PlatformAuthedRequest } from "../../../../../../platform/middleware"
import {
  findApplicationById,
  updateApplication,
} from "../../../../../../platform/repository"

/** Rejects a pending application. Frees the subdomain for a future application. */
export async function POST(
  req: PlatformAuthedRequest,
  res: MedusaResponse
): Promise<void> {
  const admin = req.platformAdmin!
  const id = req.params.id
  const body = (req.body ?? {}) as Record<string, unknown>
  const reason = typeof body.reason === "string" ? body.reason.trim() : null

  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const application = await findApplicationById(knex, id)
  if (!application) {
    res.status(404).json({ message: "Application not found" })
    return
  }
  if (application.status !== "pending") {
    res.status(409).json({
      message: `Application is '${application.status}' and cannot be rejected`,
    })
    return
  }

  await updateApplication(knex, id, {
    status: "rejected",
    provisioning_error: reason,
    reviewed_by: admin.id,
    reviewed_at: new Date(),
  })

  res.json({ status: "rejected" })
}
