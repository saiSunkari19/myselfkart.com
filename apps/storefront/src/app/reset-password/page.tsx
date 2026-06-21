import { StorefrontStatePage } from "../../components/storefront-state"
import { ResetPasswordForm } from "../../components/storefront/account/password-forms"
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

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") {
    return <StorefrontStatePage state="not-found" />
  }
  const { token, email } = await searchParams
  const config = await fetchStoreConfig(tenant)
  return (
    <main style={wrap}>
      <ResetPasswordForm token={token ?? ""} email={email ?? ""} accent={config?.accent_color ?? undefined} />
    </main>
  )
}
