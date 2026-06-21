import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

import { verifyStorefrontSignature } from "../../../../modules/tenant-context"

/**
 * POST /selfkart/oauth/redeem — exchange a single-use OTT for the customer token.
 *
 * Called server-side by the originating store's /auth/google/finish route (on its
 * own first-party domain) to retrieve the token and set a host-only session
 * cookie. The OTT is opaque, single-use (deleted on read), and short-lived, so
 * the token itself never appears in a URL. Guarded by an HMAC over `ott`.
 *
 * Body: { ott }. Header: x-selfkart-oauth-sig = sign(ott).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>
  const ott = String(body.ott ?? "")
  const sig = req.headers["x-selfkart-oauth-sig"]

  if (!ott || !verifyStorefrontSignature(ott, sig)) {
    res.status(403).json({ message: "Forbidden" })
    return
  }

  const cache: any = req.scope.resolve(Modules.CACHE)
  const payload = (await cache.get(`oauth_ott:${ott}`)) as
    | { token: string; tenantId: string; next: string }
    | null

  if (!payload) {
    res.status(400).json({ message: "This sign-in link has expired. Please try again." })
    return
  }

  await cache.invalidate(`oauth_ott:${ott}`)
  res.json({ token: payload.token, tenant_id: payload.tenantId, next: payload.next })
}
