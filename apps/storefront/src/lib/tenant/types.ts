export type TenantStatus = "draft" | "active" | "suspended"

export type TenantResolution = {
  tenantId: string
  status: TenantStatus
  publishableKey: string | null
  /** The tenant's market currency (iso 4217, lowercase), or null for older
   *  tenants. Used to resolve the matching shared region. */
  currency: string | null
}
