import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  findTenantById,
  getTenantPaymentCredentialSummary,
  upsertTenantPaymentCredentials,
  type PaymentMode,
} from "../../../../../../../platform/repository"

type RazorpayCredentialBody = {
  mode?: unknown
  enabled?: unknown
  key_id?: unknown
  key_secret?: unknown
  webhook_secret?: unknown
}

function parseMode(value: unknown): PaymentMode | null {
  return value === "test" || value === "live" ? value : null
}

function parseSecret(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function validateKeyId(keyId: string, mode: PaymentMode): string | null {
  if (!keyId) {
    return "Razorpay key id is required"
  }
  if (!keyId.startsWith(`rzp_${mode}_`)) {
    return `Razorpay ${mode} key id must start with rzp_${mode}_`
  }

  return null
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const tenant = await findTenantById(knex, req.params.id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }

  const credentials = await getTenantPaymentCredentialSummary(
    knex,
    req.params.id,
    "razorpay"
  )
  res.json({ credentials })
}

export async function POST(
  req: MedusaRequest<RazorpayCredentialBody>,
  res: MedusaResponse
): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const tenant = await findTenantById(knex, req.params.id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }

  const mode = parseMode(req.body.mode)
  if (!mode) {
    res.status(422).json({ message: "mode must be 'test' or 'live'" })
    return
  }

  const keyId = typeof req.body.key_id === "string" ? req.body.key_id.trim() : ""
  const keyError = validateKeyId(keyId, mode)
  if (keyError) {
    res.status(422).json({ message: keyError })
    return
  }

  try {
    const credentials = await upsertTenantPaymentCredentials(knex, req.params.id, {
      provider: "razorpay",
      mode,
      enabled: req.body.enabled === true,
      keyId,
      keySecret: parseSecret(req.body.key_secret),
      webhookSecret: parseSecret(req.body.webhook_secret),
    })
    res.json({ credentials })
  } catch (error) {
    res.status(422).json({
      message: error instanceof Error ? error.message : "Could not save Razorpay credentials",
    })
  }
}
