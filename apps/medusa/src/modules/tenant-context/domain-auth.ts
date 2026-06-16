import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Trusted-channel signing for the storefront -> Medusa boundary.
 *
 * The browser must NEVER assert a tenant. The Next.js server holds
 * SELFKART_STOREFRONT_SECRET and signs the tenant_id (and the resolve-domain
 * host) with HMAC-SHA256. Medusa verifies the signature before honouring the
 * value, so a browser/API client cannot forge tenant context without the secret.
 */
export const STOREFRONT_DEFAULT_BAD_SECRET =
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

export function verifyStorefrontSignature(
  value: string,
  signature: unknown,
  secret: string = getStorefrontSecret()
): boolean {
  if (typeof signature !== "string" || signature.length === 0) {
    return false
  }

  const expected = Buffer.from(signStorefrontValue(value, secret), "hex")
  let provided: Buffer
  try {
    provided = Buffer.from(signature, "hex")
  } catch {
    return false
  }

  return (
    expected.length === provided.length &&
    expected.length > 0 &&
    timingSafeEqual(expected, provided)
  )
}
