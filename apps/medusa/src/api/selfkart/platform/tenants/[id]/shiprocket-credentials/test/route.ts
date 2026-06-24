import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  findTenantById,
  getTenantShiprocketCredentialSummary,
  getTenantShiprocketSecret,
} from "../../../../../../../platform/repository"
import { shiprocketLogin, ShiprocketClient } from "../../../../../../../lib/shiprocket/client"

type TestBody = { api_email?: unknown; api_password?: unknown }

/**
 * Validates a tenant's Shiprocket credentials by minting a token (and listing
 * pickup locations) BEFORE the operator commits them. Accepts the typed email +
 * password from the form; falls back to the stored values when a field is blank
 * (so a saved integration can be re-tested without re-entering the password).
 */
export async function POST(req: MedusaRequest<TestBody>, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const tenantId = req.params.id
  const tenant = await findTenantById(knex, tenantId)
  if (!tenant) {
    res.status(404).json({ ok: false, message: "Tenant not found" })
    return
  }

  const typedEmail = typeof req.body.api_email === "string" ? req.body.api_email.trim() : ""
  const typedPassword =
    typeof req.body.api_password === "string" ? req.body.api_password.trim() : ""

  const summary = await getTenantShiprocketCredentialSummary(knex, tenantId)
  const email = typedEmail || summary?.api_email || ""
  const password =
    typedPassword || (await getTenantShiprocketSecret(knex, tenantId, "api_password")) || ""

  if (!email || !password) {
    res.status(422).json({ ok: false, message: "Enter the API user email and password to test." })
    return
  }

  try {
    const token = await shiprocketLogin(email, password)
    const locations = await new ShiprocketClient(token).getPickupLocations()
    res.json({
      ok: true,
      pickup_locations: locations.map((l) => l.pickup_location).filter(Boolean),
    })
  } catch (error) {
    res.status(200).json({
      ok: false,
      message: error instanceof Error ? error.message : "Shiprocket authentication failed",
    })
  }
}
