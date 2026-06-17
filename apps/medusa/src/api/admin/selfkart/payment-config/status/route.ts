import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { getTenantPaymentCredentialSummary } from "../../../../../platform/repository"
import { requireTenantContext } from "../../../../../modules/tenant-context"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { tenantId } = requireTenantContext()
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const razorpay = await getTenantPaymentCredentialSummary(knex, tenantId, "razorpay")

  res.json({
    razorpay: razorpay
      ? {
          provider: razorpay.provider,
          mode: razorpay.mode,
          enabled: razorpay.enabled,
          ready: razorpay.ready,
          key_id: razorpay.key_id,
          key_secret_hint: razorpay.key_secret_hint,
          webhook_secret_hint: razorpay.webhook_secret_hint,
          updated_at: razorpay.updated_at,
        }
      : null,
  })
}
