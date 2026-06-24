import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  findTenantById,
  getTenantShiprocketCredentialSummary,
  upsertTenantShiprocketCredentials,
} from "../../../../../../platform/repository"

type ShiprocketCredentialBody = {
  enabled?: unknown
  api_email?: unknown
  api_password?: unknown
  webhook_secret?: unknown
  pickup_location?: unknown
}

function parseStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const t = value.trim()
  return t ? t : undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const tenant = await findTenantById(knex, req.params.id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }
  const credentials = await getTenantShiprocketCredentialSummary(knex, req.params.id)
  res.json({ credentials })
}

export async function POST(
  req: MedusaRequest<ShiprocketCredentialBody>,
  res: MedusaResponse
): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const tenant = await findTenantById(knex, req.params.id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }

  const apiEmail = parseStr(req.body.api_email)
  if (!apiEmail) {
    res.status(422).json({ message: "api_email is required" })
    return
  }

  try {
    const credentials = await upsertTenantShiprocketCredentials(knex, req.params.id, {
      enabled: req.body.enabled === true,
      apiEmail,
      apiPassword: parseStr(req.body.api_password),
      webhookSecret: parseStr(req.body.webhook_secret),
      pickupLocation: parseStr(req.body.pickup_location),
    })
    res.json({ credentials })
  } catch (error) {
    res.status(422).json({
      message: error instanceof Error ? error.message : "Could not save Shiprocket credentials",
    })
  }
}
