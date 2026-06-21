import Link from "next/link"
import { notFound } from "next/navigation"

import { AddToCart } from "../../../components/add-to-cart"
import { getTenantProductByHandle, listTenantProducts, type StoreProduct } from "../../../lib/medusa/products"
import { fetchStoreConfig } from "../../../lib/store-config"
import { resolveTenant } from "../../../lib/tenant/resolve-tenant"
import { TemplateConfigProvider } from "../../../lib/template-config-context"

import VoltProductDetailPage from "../../preview/volt/products/[id]/page"
import ThreadProductDetailPage from "../../preview/thread/products/[id]/page"
import AurumProductDetailPage from "../../preview/aurum/products/[id]/page"
import { ProductDetailClient as GlowProductDetailClient } from "../../preview/glow/products/[id]/_product-client"
import { PRODUCTS as GLOW_PRODUCTS, type Product as GlowProduct } from "../../preview/glow/_data"

export const dynamic = "force-dynamic"

function toGlowProduct(p: StoreProduct): GlowProduct {
  return {
    id: p.id, name: p.title, subtitle: p.description?.slice(0, 60) ?? "",
    category: "Skincare", price: p.variants?.find(v => v.calculated_price?.calculated_amount != null)?.calculated_price?.calculated_amount ?? 0,
    image: p.thumbnail ?? "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
    hoverImage: p.thumbnail ?? "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
    rating: 4.5, reviews: 128, skinTypes: [], concerns: [], description: p.description ?? "", keyIngredients: [], size: "",
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null
  const template = config?.template_id

  if (template === "volt") {
    const colorVars = {
      ...(config?.primary_color ? { "--text": config.primary_color } : {}),
      ...(config?.accent_color  ? { "--accent": config.accent_color } : {}),
    }
    return (
      <TemplateConfigProvider config={config} basePath="">
        <div style={colorVars as React.CSSProperties}><VoltProductDetailPage /></div>
      </TemplateConfigProvider>
    )
  }

  if (template === "thread") {
    return (
      <TemplateConfigProvider config={config} basePath="">
        <ThreadProductDetailPage />
      </TemplateConfigProvider>
    )
  }

  if (template === "aurum") {
    return (
      <TemplateConfigProvider config={config} basePath="">
        <AurumProductDetailPage />
      </TemplateConfigProvider>
    )
  }

  if (template === "glow") {
    const rawProducts = tenant ? await listTenantProducts(tenant) : []
    const glowProducts = rawProducts.length > 0 ? rawProducts.map(toGlowProduct) : GLOW_PRODUCTS
    const product = glowProducts.find(p => p.id === id)
    if (!product) return notFound()
    const related = glowProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)
    return <GlowProductDetailClient product={product} related={related} config={config} />
  }

  // Legacy non-templated store: lookup by handle in the generic catalogue.
  if (!tenant || tenant.status !== "active") {
    notFound()
  }

  const product = await getTenantProductByHandle(tenant, id)
  if (!product) {
    notFound()
  }

  return (
    <main>
      <p>
        <Link href="/">← Back to shop</Link>
      </p>
      {product.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.thumbnail}
          alt={product.title}
          style={{ maxWidth: "320px", borderRadius: "10px" }}
        />
      ) : null}
      <h1>{product.title}</h1>
      {product.description ? <p>{product.description}</p> : null}
      <AddToCart variants={product.variants ?? []} />
    </main>
  )
}
