import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { buildAuthData } from "../../_lib/route-helpers"
import { resolveTenantCustomerToken } from "../../_lib/resolve-tenant-customer"

/**
 * POST /store/auth/customer/emailpass — email/password LOGIN.
 *
 * Runs under /store* so the signed tenant headers are present (tenant in ALS).
 * Verifies the global emailpass credential, then resolves/creates THIS tenant's
 * customer and mints a tenant-scoped customer token. Body: { email, password }.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const authService: any = req.scope.resolve(Modules.AUTH)
  const result = await authService.authenticate("emailpass", buildAuthData(req))

  if (!result.success || !result.authIdentity) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, result.error || "Invalid email or password.")
  }

  const token = await resolveTenantCustomerToken(req.scope, result.authIdentity, "emailpass")
  res.json({ token })
}
