import "server-only"

import { createHmac } from "node:crypto"

/**
 * Storefront -> Medusa trusted-channel signing.
 *
 * MUST stay byte-for-byte compatible with the Medusa backend's
 * `apps/medusa/src/modules/tenant-context/domain-auth.ts` (same HMAC-SHA256 hex
 * over the same value, same secret). The storefront server signs:
 *   - the Host, to call /selfkart/resolve-domain (x-selfkart-host-sig)
 *   - the resolved tenant_id, to call /store* (x-selfkart-tenant-sig)
 *
 * The secret lives only on the server. The browser never holds it and never
 * asserts a tenant — tenant context is derived server-side from the Host.
 */
const STOREFRONT_DEFAULT_BAD_SECRET =
  "phase1-storefront-secret-change-before-production"

export function getStorefrontSecret(): string {
  return process.env.SELFKART_STOREFRONT_SECRET || STOREFRONT_DEFAULT_BAD_SECRET
}

export function signStorefrontValue(
  value: string,
  secret: string = getStorefrontSecret()
): string {
  return createHmac("sha256", secret).update(value).digest("hex")
}
