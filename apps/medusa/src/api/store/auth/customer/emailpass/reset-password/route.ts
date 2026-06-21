import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateResetPasswordTokenWorkflow } from "@medusajs/core-flows"

import { requireTenantContext } from "../../../../../../modules/tenant-context"

/**
 * POST /store/auth/customer/emailpass/reset-password — request a password reset.
 *
 * Tenant-aware wrapper around the stock reset flow. We run under /store* so the
 * tenant is known from the signed headers, and we pass `metadata.tenant_id` into
 * the emitted `auth.password_reset` event. The subscriber
 * (src/subscribers/customer-password-reset.ts) then builds a SERVER-DERIVED reset
 * URL on that tenant's storefront host — never a client-supplied URL, which would
 * be a phishing vector. Always responds 201 so we never leak whether an email is
 * registered. Body: { email }.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { tenantId } = requireTenantContext()
  const body = (req.body ?? {}) as Record<string, unknown>
  const email = String(body.email ?? body.identifier ?? "").toLowerCase().trim()

  if (email) {
    const config: any = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    const { http } = config.projectConfig
    await generateResetPasswordTokenWorkflow(req.scope).run({
      input: {
        entityId: email,
        actorType: "customer",
        provider: "emailpass",
        secret: http.jwtSecret,
        jwtOptions: http.jwtOptions,
        metadata: { tenant_id: tenantId },
      },
      // Don't throw: a non-existent identity must not reveal itself.
      throwOnError: false,
    })
  }

  res.sendStatus(201)
}
