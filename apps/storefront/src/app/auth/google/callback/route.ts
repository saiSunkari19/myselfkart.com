import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { baseMedusa } from "../../../../lib/medusa/client"
import { signStorefrontValue } from "../../../../lib/tenant/signing"

export const dynamic = "force-dynamic"

function storeUrl(host: string, path: string): string {
  const proto = host.includes("localhost") ? "http" : "https"
  return `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Google OAuth callback — the single registered redirect host (the broker).
 *
 * Google sends the browser here. The broker does not know the buyer's tenant, so
 * it asks Medusa to complete the exchange (Medusa recovers origin + tenant from
 * the cache keyed by `state`) and return a single-use handoff token (OTT). The
 * broker then redirects the browser to the ORIGIN store's own domain, where
 * /auth/google/finish redeems the OTT and sets a first-party session cookie.
 * Works identically for subdomains and fully custom seller domains.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  const brokerFail = (message: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, req.url))

  if (!code || !state) return brokerFail("Google sign-in was cancelled.")

  let result: { ok: boolean; ott?: string; origin_host?: string; next?: string; error?: string }
  try {
    result = await baseMedusa.client.fetch("/selfkart/oauth/google/complete", {
      method: "POST",
      body: { code, state },
      headers: { "x-selfkart-oauth-sig": signStorefrontValue(state) },
    })
  } catch {
    return brokerFail("Google sign-in failed. Please try again.")
  }

  // Once we know the origin store, surface errors there (not on the broker host).
  if (!result.ok || !result.ott || !result.origin_host) {
    const host = result.origin_host
    const message = result.error || "Google sign-in failed. Please try again."
    return host
      ? NextResponse.redirect(storeUrl(host, `/login?error=${encodeURIComponent(message)}`))
      : brokerFail(message)
  }

  return NextResponse.redirect(
    storeUrl(result.origin_host, `/auth/google/finish?ott=${encodeURIComponent(result.ott)}`)
  )
}
