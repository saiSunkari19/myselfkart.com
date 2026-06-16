import "server-only"

import Medusa from "@medusajs/js-sdk"

import { signStorefrontValue } from "../tenant/signing"
import type { TenantResolution } from "../tenant/types"

export const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

/**
 * Base client with NO tenant or publishable-key context.
 *
 * Used only for the server-to-server domain resolver (`/selfkart/resolve-domain`,
 * a platform route — not `/store*`), which is guarded by the Host HMAC signature
 * rather than a publishable key.
 */
export const baseMedusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL })

/**
 * Per-request client bound to a single resolved tenant.
 *
 * Attaches the tenant's publishable key (so Medusa scopes `/store*` to the
 * tenant's sales channel) and the signed tenant headers (so the tenant-context
 * middleware sets `app.current_tenant` and Postgres RLS scopes every query). The
 * browser never sees either value — this client only runs server-side.
 */
export function getTenantMedusa(tenant: TenantResolution): Medusa {
  return new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    publishableKey: tenant.publishableKey ?? undefined,
    globalHeaders: {
      "x-selfkart-tenant-id": tenant.tenantId,
      "x-selfkart-tenant-sig": signStorefrontValue(tenant.tenantId),
    },
  })
}
