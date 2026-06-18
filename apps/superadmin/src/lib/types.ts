export type ApplicationStatus =
  | "pending"
  | "approved"
  | "provisioning"
  | "active"
  | "rejected"
  | "failed"

export type SellingOn =
  | "instagram_whatsapp"
  | "flipkart_amazon"
  | "offline_retail"
  | "other"

export type SellerApplication = {
  id: string
  store_name: string
  owner_name: string
  owner_email: string
  desired_subdomain: string
  country: string
  currency: string
  phone: string | null
  selling_on: SellingOn | null
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

export type TenantDomain = {
  id: string
  host: string
  is_primary: boolean
  created_at: string
}

export type TenantStats = {
  products: number
  orders: number
  customers: number
}

export type TenantDetail = {
  tenant: Tenant
  domains: TenantDomain[]
  stats: TenantStats
  admin_email: string | null
  payment_credentials: {
    razorpay: TenantPaymentCredential | null
  }
  owner: {
    name: string
    email: string
    phone: string | null
    applied_at: string
  } | null
}

export type TenantPaymentCredential = {
  provider: "razorpay"
  mode: "test" | "live"
  enabled: boolean
  key_id: string
  key_secret_hint: string
  webhook_secret_hint: string
  ready: boolean
  updated_at: string
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
