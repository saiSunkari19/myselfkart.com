import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { setCustomerToken } from "../../../../lib/customer/cookie"
import { baseMedusa } from "../../../../lib/medusa/client"
import { resolveTenant } from "../../../../lib/tenant/resolve-tenant"
import { signStorefrontValue } from "../../../../lib/tenant/signing"

export const dynamic = "force-dynamic"

/**
 * Google OAuth finish — runs on the ORIGIN store's own domain (subdomain OR a
 * seller's custom domain). Redeems the single-use handoff token for the customer
 * session and sets it as a first-party, host-only cookie, then continues to the
 * post-login destination. The token only ever travels server-to-server.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  const ott = url.searchParams.get("ott")

  const fail = (message: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, req.url))

  if (!ott) return fail("That sign-in link was invalid.")

  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") return fail("Store not found.")

  let payload: { token?: string; tenant_id?: string; next?: string }
  try {
    payload = await baseMedusa.client.fetch("/selfkart/oauth/redeem", {
      method: "POST",
      body: { ott },
      headers: { "x-selfkart-oauth-sig": signStorefrontValue(ott) },
    })
  } catch {
    return fail("This sign-in link has expired. Please try again.")
  }

  // The token is tenant-bound; confirm it matches the store we're on.
  if (!payload.token || payload.tenant_id !== tenant.tenantId) {
    return fail("Sign-in could not be completed.")
  }

  await setCustomerToken(payload.token)
  const next =
    typeof payload.next === "string" && payload.next.startsWith("/") && !payload.next.startsWith("//")
      ? payload.next
      : "/account"
  return NextResponse.redirect(new URL(next, req.url))
}
