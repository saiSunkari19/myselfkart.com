/**
 * Pure helpers for the multi-tenant email sender identity (Shopify pattern).
 *
 * Buyer mail is sent From: "<Store>" <store+<tenant_id>@<sending-domain>>. The
 * tenant_id in the local part gives per-store identity + bounce attribution from
 * ONE verified domain (no per-seller DNS). No framework imports here, so these are
 * trivially unit-testable. See docs/email-transactional-v1-prd.md.
 */

/** The verified Resend sending domain. Defaults to the apex `myselfkart.com`. */
export function getSendingDomain(): string {
  const explicit = process.env.SELFKART_EMAIL_DOMAIN?.trim()
  if (explicit) return explicit
  const fromDomain = process.env.RESEND_FROM?.split("@")[1]?.trim()
  return fromDomain || "myselfkart.com"
}

/** Strip characters that could break (or be injected into) an email header. */
export function sanitizeDisplayName(name: string | null | undefined): string {
  return (name ?? "").replace(/["<>\r\n,]/g, " ").replace(/\s+/g, " ").trim() || "Store"
}

/**
 * Build the per-tenant buyer `From` header. Throws when `tenantId` is missing so a
 * context-less caller fails closed instead of sending under a blank/wrong identity.
 */
export function buildStoreFrom(
  storeName: string | null | undefined,
  tenantId: string,
  domain: string = getSendingDomain()
): string {
  if (!tenantId) {
    throw new Error("[store-sender] tenantId is required to build the sender identity")
  }
  return `"${sanitizeDisplayName(storeName)}" <store+${tenantId}@${domain}>`
}
