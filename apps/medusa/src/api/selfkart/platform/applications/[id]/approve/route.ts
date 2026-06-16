import type { MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import type { PlatformAuthedRequest } from "../../../../../../platform/middleware"
import { findApplicationById } from "../../../../../../platform/repository"
import { provisionSellerFromApplication } from "../../../../../../platform/provision-seller"

/**
 * Approves a pending/failed application and provisions the seller end to end.
 *
 * Runs the provisioning inline (the pilot has no job queue). Each underlying
 * step is idempotent, so a `failed` application can be re-approved to retry. On
 * success returns the one-time seller admin credential for the operator to relay.
 */
export async function POST(
  req: PlatformAuthedRequest,
  res: MedusaResponse
): Promise<void> {
  const admin = req.platformAdmin!
  const id = req.params.id
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const application = await findApplicationById(knex, id)
  if (!application) {
    res.status(404).json({ message: "Application not found" })
    return
  }
  // Only pending or failed (retry) applications can be approved. Reject re-running
  // an already active/provisioning one.
  if (!["pending", "failed"].includes(application.status)) {
    res.status(409).json({
      message: `Application is '${application.status}' and cannot be approved`,
    })
    return
  }

  try {
    const result = await provisionSellerFromApplication(req.scope, application, admin.id)
    res.json({ status: "active", ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ status: "failed", message })
  }
}
