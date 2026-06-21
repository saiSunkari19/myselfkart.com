import "server-only"

import { headers } from "next/headers"
import { cache } from "react"

import { baseMedusa } from "../medusa/client"
import { signStorefrontValue } from "./signing"
import type { TenantResolution, TenantStatus } from "./types"

type ResolveResponse = {
  tenant_id: string
  status: TenantStatus
  publishable_key: string | null
  currency: string | null
}

/**
 * Extracts the storefront host from the incoming request, normalized for the
 * registry lookup (lowercased, port stripped, first value only). Prefers
 * `x-forwarded-host` so it works behind a reverse proxy / load balancer.
 */
function resolveHost(headerHost: string | null): string {
  if (!headerHost) {
    return ""
  }
  return headerHost.split(",")[0].trim().toLowerCase().split(":")[0]
}

/**
 * Resolves the current tenant from the request Host, server-side.
 *
 * The browser never asserts a tenant: we read the Host, sign it, and ask Medusa
 * to map it to a tenant via the HMAC-guarded `/selfkart/resolve-domain` route.
 * Returns `null` for an unknown host (or any resolver failure), so callers can
 * render a safe "store not found" page. Memoized per request with React
 * `cache()` so the layout and page share one lookup.
 */
/** Resolve a tenant for an explicit host (e.g. the Google OAuth origin store). */
export async function resolveTenantForHost(
  rawHost: string | null
): Promise<TenantResolution | null> {
  const host = resolveHost(rawHost)
  if (!host) {
    return null
  }

  try {
    const data = await baseMedusa.client.fetch<ResolveResponse>(
      "/selfkart/resolve-domain",
      {
        query: { host },
        headers: { "x-selfkart-host-sig": signStorefrontValue(host) },
        cache: "no-store",
      }
    )

    return {
      tenantId: data.tenant_id,
      status: data.status,
      publishableKey: data.publishable_key ?? null,
      currency: data.currency ?? null,
    }
  } catch {
    // Unknown host (404), bad signature (403), or backend unavailable: fail
    // closed to "no tenant" so the caller renders a safe page.
    return null
  }
}

export const resolveTenant = cache(async (): Promise<TenantResolution | null> => {
  const headerList = await headers()
  return resolveTenantForHost(
    headerList.get("x-forwarded-host") || headerList.get("host")
  )
})
