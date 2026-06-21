import { notFound } from "next/navigation"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"
import { TemplateConfigProvider } from "../../lib/template-config-context"

import { CheckoutClient as GlowCheckoutClient } from "../preview/glow/checkout/_checkout-client"
import VoltCheckoutPage from "../preview/volt/checkout/page"
import ThreadCheckoutPage from "../preview/thread/checkout/page"
import AurumCheckoutPage from "../preview/aurum/checkout/page"
import EventpassCheckoutPage from "../preview/eventpass/checkout/page"

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null
  const template = config?.template_id

  if (!template) return notFound()

  const wrap = (node: React.ReactNode) => (
    <TemplateConfigProvider config={config} basePath="">
      {node}
    </TemplateConfigProvider>
  )

  switch (template) {
    case "glow":      return wrap(<GlowCheckoutClient config={config} />)
    case "volt":      return wrap(<VoltCheckoutPage />)
    case "thread":    return wrap(<ThreadCheckoutPage />)
    case "aurum":     return wrap(<AurumCheckoutPage />)
    case "eventpass": return wrap(<EventpassCheckoutPage />)
    default:          return notFound()
  }
}
