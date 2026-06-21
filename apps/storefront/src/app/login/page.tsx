import { redirect } from "next/navigation"

import { StorefrontStatePage } from "../../components/storefront-state"
import { getCustomerToken } from "../../lib/customer/cookie"
import { getCurrentCustomer } from "../../lib/medusa/customer"
import { getTheme } from "../../lib/themes"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"

export const dynamic = "force-dynamic"

function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account"
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>
}) {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") {
    return <StorefrontStatePage state="not-found" />
  }

  const { next, error, reset } = await searchParams
  const dest = safeNext(next)

  // Already signed in → skip the form.
  const token = await getCustomerToken()
  const customer = await getCurrentCustomer(tenant, token)
  if (customer) redirect(dest)

  const config = await fetchStoreConfig(tenant)
  const Theme = getTheme(config?.template_id)
  return (
    <Theme.Login
      config={config}
      next={dest}
      error={error ?? null}
      notice={reset ? "Your password has been reset. Please sign in." : null}
    />
  )
}
