import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  generateJwtToken,
} from "@medusajs/framework/utils"

import { requireTenantContext } from "../../../../modules/tenant-context"

/**
 * POST /store/auth/refresh — re-mint a customer token from the current one.
 *
 * The built-in /auth/token/refresh re-derives actor_id from the singular
 * `app_metadata.customer_id` (which we never set) and has no tenant context, so it
 * is unusable here. This route is guarded by `authenticate("customer", ["bearer"])`
 * (see src/api/middlewares.ts), so `req.auth_context.actor_id` is the verified
 * tenant-scoped customer; we just mint a fresh token with the same actor.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  requireTenantContext()
  const auth = (req as any).auth_context
  if (!auth?.actor_id || auth.actor_type !== "customer") {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Not authenticated.")
  }

  const config: any = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { http } = config.projectConfig
  const token = generateJwtToken(
    {
      actor_id: auth.actor_id,
      actor_type: "customer",
      auth_identity_id: auth.auth_identity_id,
      app_metadata: { customer_id: auth.actor_id },
    },
    {
      secret: http.jwtSecret,
      expiresIn: http.jwtExpiresIn ?? "7d",
      jwtOptions: http.jwtOptions,
    }
  )
  res.json({ token })
}
