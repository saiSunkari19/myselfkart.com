import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { requireTenantContext } from "../../../../../modules/tenant-context"
import { buildAuthData } from "../../_lib/route-helpers"

/**
 * POST /store/auth/customer/google — START the Google OAuth flow.
 *
 * Returns a `location` to redirect the browser to. We also stash the originating
 * store host + post-login destination + tenant in the cache, keyed by the OAuth
 * `state` Google round-trips. That lets the broker callback recover the origin
 * even across domains (custom seller domains included) without any cross-domain
 * cookie. Body: { callback_url, origin_host, next }.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { tenantId } = requireTenantContext()
  const authService: any = req.scope.resolve(Modules.AUTH)
  const result = await authService.authenticate("google", buildAuthData(req))

  if (!result.location) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, result.error || "Could not start Google sign-in.")
  }

  const state = new URL(result.location).searchParams.get("state")
  if (state) {
    const body = (req.body ?? {}) as Record<string, unknown>
    const cache: any = req.scope.resolve(Modules.CACHE)
    await cache.set(
      `oauth_login:${state}`,
      {
        originHost: String(body.origin_host ?? ""),
        next: String(body.next ?? "/account"),
        tenantId,
      },
      600
    )
  }

  res.json({ location: result.location })
}
