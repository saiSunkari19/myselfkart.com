export type TenantStatus = "draft" | "active" | "suspended"

export type TenantResolution = {
  tenantId: string
  status: TenantStatus
  publishableKey: string | null
}
