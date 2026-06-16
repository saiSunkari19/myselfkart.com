export type ApplicationStatus =
  | "pending"
  | "approved"
  | "provisioning"
  | "active"
  | "rejected"
  | "failed"

export type SellerApplication = {
  id: string
  store_name: string
  owner_name: string
  owner_email: string
  desired_subdomain: string
  country: string
  currency: string
  phone: string | null
  notes: string | null
  status: ApplicationStatus
  tenant_id: string | null
  host: string | null
  provisioning_error: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type Tenant = {
  id: string
  name: string
  slug: string
  status: string
  plan: string | null
  created_at: string
  host: string | null
}

export type PlatformAdmin = {
  id: string
  email: string
  name: string
  role: "owner" | "operator"
}

export type Overview = {
  counts: {
    pendingApplications: number
    activeTenants: number
    totalTenants: number
  }
  recentApplications: SellerApplication[]
  recentTenants: Tenant[]
}
