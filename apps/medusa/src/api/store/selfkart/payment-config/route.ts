import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { getTenantPaymentCredentialSummary } from "../../../../platform/repository"
import { requireTenantContext } from "../../../../modules/tenant-context"

/**
 * Storefront-facing payment config for the current tenant (resolved from the
 * signed domain context by the /store* middleware). Returns ONLY what the
 * checkout UI needs to render the right options — never any secret.
 *
 * `razorpay` is non-null only when the seller has enabled AND fully configured
 * Razorpay; it carries the PUBLIC key id and mode so the storefront can open the
 * Razorpay checkout widget.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { tenantId } = requireTenantContext()
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const summary = await getTenantPaymentCredentialSummary(
    knex,
    tenantId,
    "razorpay"
  )

  res.json({
    razorpay:
      summary && summary.enabled && summary.ready
        ? {
            provider_id: "pp_razorpay_razorpay",
            key_id: summary.key_id,
            mode: summary.mode,
          }
        : null,
  })
}
