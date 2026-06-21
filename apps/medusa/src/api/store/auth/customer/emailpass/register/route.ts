import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { buildAuthData } from "../../../_lib/route-helpers"
import { resolveTenantCustomerToken } from "../../../_lib/resolve-tenant-customer"

/**
 * POST /store/auth/customer/emailpass/register — create an email/password account.
 *
 * emailpass identities are GLOBAL (one per email across all stores). If the email
 * is new, we register the credential; if it already exists globally, we fall back
 * to authenticating with the supplied password (so a buyer who signed up on another
 * store can use the same email here). Either way we then resolve/create THIS
 * tenant's customer and mint its token. Body: { email, password, first_name?, last_name? }.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const authService: any = req.scope.resolve(Modules.AUTH)
  const body = (req.body ?? {}) as Record<string, unknown>

  const registration = await authService.register("emailpass", { body })
  let authIdentity = registration.authIdentity

  if (!registration.success || !authIdentity) {
    // Already registered globally → try to authenticate with the same password.
    const auth = await authService.authenticate("emailpass", buildAuthData(req))
    if (!auth.success || !auth.authIdentity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "An account with this email already exists. Please sign in instead."
      )
    }
    authIdentity = auth.authIdentity
  }

  const token = await resolveTenantCustomerToken(req.scope, authIdentity, "emailpass")
  res.json({ token })
}
