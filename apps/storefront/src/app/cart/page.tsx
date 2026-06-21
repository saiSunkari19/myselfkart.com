import { notFound } from "next/navigation"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"
import { TemplateConfigProvider } from "../../lib/template-config-context"

import { CartClient as GlowCartClient } from "../preview/glow/cart/_cart-client"
import VoltCartPage from "../preview/volt/cart/page"
import ThreadCartPage from "../preview/thread/cart/page"
import AurumCartPage from "../preview/aurum/cart/page"
import EventpassCartPage from "../preview/eventpass/cart/page"

export const dynamic = "force-dynamic"

export default async function CartPage() {
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
    case "glow":      return wrap(<GlowCartClient config={config} />)
    case "volt":      return wrap(<VoltCartPage />)
    case "thread":    return wrap(<ThreadCartPage />)
    case "aurum":     return wrap(<AurumCartPage />)
    case "eventpass": return wrap(<EventpassCartPage />)
    default:          return notFound()
  }
}
