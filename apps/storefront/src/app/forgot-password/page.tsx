import { StorefrontStatePage } from "../../components/storefront-state"
import { ForgotPasswordForm } from "../../components/storefront/account/password-forms"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"

export const dynamic = "force-dynamic"

const wrap = {
  padding: "60px 20px",
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const

export default async function ForgotPasswordPage() {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") {
    return <StorefrontStatePage state="not-found" />
  }
  const config = await fetchStoreConfig(tenant)
  return (
    <main style={wrap}>
      <ForgotPasswordForm accent={config?.accent_color ?? undefined} />
    </main>
  )
}
