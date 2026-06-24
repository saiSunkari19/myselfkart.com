import { randomBytes } from "node:crypto"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
  requireTenantContext,
  runWithTenantContext,
  verifyStorefrontSignature,
} from "../../../../../modules/tenant-context"
import { resolveTenantCustomerToken } from "../../../../store/auth/_lib/resolve-tenant-customer"

/**
 * POST /selfkart/oauth/google/complete — broker leg of Google sign-in.
 *
 * Lives OUTSIDE /store* on purpose: the broker host (the single registered Google
 * callback) does not know the buyer's tenant, so it cannot send signed tenant
 * headers. Instead this route recovers the origin + tenant from the cache entry
 * stashed at start (keyed by the OAuth `state`), completes the code exchange,
 * mints the tenant-scoped customer token, and hands it back as a single-use OTT
 * (so the token never travels in a URL). Guarded by an HMAC over `state` with
 * SELFKART_STOREFRONT_SECRET — only the storefront server can call it.
 *
 * Body: { code, state }. Header: x-selfkart-oauth-sig = sign(state).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>
  const code = String(body.code ?? "")
  const state = String(body.state ?? "")
  const sig = req.headers["x-selfkart-oauth-sig"]

  if (!state || !verifyStorefrontSignature(state, sig)) {
    res.status(403).json({ message: "Forbidden" })
    return
  }

  const cache: any = req.scope.resolve(Modules.CACHE)
  const origin = (await cache.get(`oauth_login:${state}`)) as
    | { originHost: string; next: string; tenantId: string }
    | null

  if (!origin) {
    res.status(400).json({ ok: false, error: "Your sign-in session expired. Please try again." })
    return
  }

  const authService: any = req.scope.resolve(Modules.AUTH)
  const result = await authService.validateCallback("google", {
    actor_type: "customer",
    url: req.url,
    headers: req.headers,
    query: { code, state },
    body,
    protocol: req.protocol,
  })

  if (!result.success || !result.authIdentity) {
    res.status(200).json({ ok: false, origin_host: origin.originHost, error: "Google sign-in failed." })
    return
  }

  // The broker has no ambient tenant context, so establish it from the stashed
  // tenant before resolving/creating the tenant-scoped customer. Any failure here
  // (e.g. customer resolution) must still return 200 with origin_host so the
  // storefront callback surfaces the error on the ORIGIN store's /login — a thrown
  // 500 carries no body, dropping origin_host and stranding the buyer on the
  // broker host instead.
  let token: string
  try {
    token = await runWithTenantContext({ tenantId: origin.tenantId, source: "domain" }, () => {
      requireTenantContext()
      return resolveTenantCustomerToken(req.scope, result.authIdentity, "google")
    })
  } catch (error) {
    const logger: any = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error(
      `[selfkart] Google sign-in customer resolution failed (tenant=${origin.tenantId}): ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    res.status(200).json({
      ok: false,
      origin_host: origin.originHost,
      error: "We couldn't finish signing you in. Please try again.",
    })
    return
  }

  const ott = randomBytes(32).toString("hex")
  await cache.set(`oauth_ott:${ott}`, { token, tenantId: origin.tenantId, next: origin.next }, 120)
  await cache.invalidate(`oauth_login:${state}`)

  res.json({ ok: true, ott, origin_host: origin.originHost, next: origin.next })
}
