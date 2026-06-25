import { notFound, redirect } from "next/navigation"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"
import { listTenantProducts } from "../../lib/medusa/products"
import { resolveCategories, resolveCollections, mapProducts } from "../../lib/views"
import { getDeals, getNewArrivals } from "../../lib/merchandising"
import { getCartItemCount } from "../../lib/cart/item-count"
import { TemplateConfigProvider } from "../../lib/template-config-context"

// ── Volt sub-page imports ──
import VoltDealsPage from "../preview/volt/deals/page"
import VoltShopPage from "../preview/volt/shop/page"
import VoltCartPage from "../preview/volt/cart/page"
import VoltCheckoutPage from "../preview/volt/checkout/page"
import VoltAboutPage from "../preview/volt/about/page"
import { VoltCategoriesLivePage, VoltNewLaunchesLivePage } from "../preview/volt/_listing-live"
import VoltFaqPage from "../preview/volt/faq/page"
import VoltPrivacyPage from "../preview/volt/privacy/page"
import VoltTermsPage from "../preview/volt/terms/page"
import VoltShippingPage from "../preview/volt/shipping/page"
import VoltReturnsPage from "../preview/volt/returns/page"
import VoltWarrantyPage from "../preview/volt/warranty/page"
import VoltConfirmationPage from "../preview/volt/confirmation/page"

// ── Glow sub-page imports ──
import { ShopClient as GlowShopClient } from "../preview/glow/shop/_shop-client"
import { CartClient as GlowCartClient } from "../preview/glow/cart/_cart-client"
import { CheckoutClient as GlowCheckoutClient } from "../preview/glow/checkout/_checkout-client"
import { AboutClient as GlowAboutClient } from "../preview/glow/about/_about-client"
import { ProductDetailClient as GlowProductDetailClient } from "../preview/glow/products/[id]/_product-client"
import type { Product as GlowProduct } from "../preview/glow/_data"
import type { StoreProduct } from "../../lib/medusa/products"

// ── Thread sub-page imports ──
import ThreadCartPage from "../preview/thread/cart/page"
import ThreadCheckoutPage from "../preview/thread/checkout/page"
import ThreadAboutPage from "../preview/thread/about/page"
import { ThreadCategoriesLivePage } from "../preview/thread/_listing-live"
import ThreadFaqPage from "../preview/thread/faq/page"
import ThreadPrivacyPage from "../preview/thread/privacy/page"
import ThreadTermsPage from "../preview/thread/terms/page"
import ThreadReturnsPage from "../preview/thread/returns/page"
import ThreadConfirmationPage from "../preview/thread/confirmation/page"

// ── Aurum sub-page imports ──
import AurumShopPage from "../preview/aurum/shop/page"
import AurumCartPage from "../preview/aurum/cart/page"
import AurumCheckoutPage from "../preview/aurum/checkout/page"
import AurumAboutPage from "../preview/aurum/about/page"
import { AurumCollectionsLivePage } from "../preview/aurum/_collections-live"
import { AurumNewArrivalsLivePage } from "../preview/aurum/_newarrivals-live"
import AurumContactPage from "../preview/aurum/contact/page"
import AurumFaqPage from "../preview/aurum/faq/page"
import AurumPrivacyPage from "../preview/aurum/privacy/page"
import AurumTermsPage from "../preview/aurum/terms/page"
import AurumReturnsPage from "../preview/aurum/returns/page"
import AurumShippingPage from "../preview/aurum/shipping/page"
import AurumStoreLocatorPage from "../preview/aurum/store-locator/page"
import AurumCertificationPage from "../preview/aurum/certification/page"
import AurumCareGuidePage from "../preview/aurum/care-guide/page"
import AurumConfirmationPage from "../preview/aurum/confirmation/page"

// ── Eventpass sub-page imports ──
import EventpassCartPage from "../preview/eventpass/cart/page"
import EventpassCheckoutPage from "../preview/eventpass/checkout/page"
import EventpassAboutPage from "../preview/eventpass/about/page"
import { EventpassCategoriesLivePage } from "../preview/eventpass/_listing-live"
import EventpassFaqPage from "../preview/eventpass/faq/page"
import EventpassPrivacyPage from "../preview/eventpass/privacy/page"
import EventpassTermsPage from "../preview/eventpass/terms/page"
import EventpassRefundPage from "../preview/eventpass/refund/page"
import EventpassConfirmationPage from "../preview/eventpass/confirmation/page"

export const dynamic = "force-dynamic"

export default async function TemplateSubPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug: slugParts } = await params
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null
  const template = config?.template_id

  if (!template) return notFound()

  const slug = (slugParts ?? []).join("/")

  // Shared nav/footer data (real bag count, category list, whether to show a
  // Deals link) for every template's static info pages — keeps About/Privacy/
  // Terms/etc. header & footer identical to the live shop/cart/PDP pages,
  // instead of the separate hardcoded nav each template used to render here.
  const [cartCount, navProducts] = template !== "glow"
    ? await Promise.all([
        tenant ? getCartItemCount(tenant) : 0,
        tenant ? listTenantProducts(tenant) : [],
      ])
    : [0, []]
  const categories = resolveCategories(navProducts)
  const hasDeals = getDeals(navProducts).length > 0

  // ── VOLT ──
  if (template === "volt") {
    const colorVars = {
      ...(config?.primary_color ? { "--text": config.primary_color } : {}),
      ...(config?.accent_color  ? { "--accent": config.accent_color } : {}),
    }
    const wrap = (node: React.ReactNode) => (
      <TemplateConfigProvider config={config} basePath="" cartCount={cartCount} hasDeals={hasDeals} categories={categories}>
        <div style={colorVars as React.CSSProperties}>{node}</div>
      </TemplateConfigProvider>
    )
    switch (slug) {
      case "deals":         return wrap(<VoltDealsPage />)
      case "shop":          return wrap(<VoltShopPage />)
      case "cart":          return wrap(<VoltCartPage />)
      case "checkout":      return wrap(<VoltCheckoutPage />)
      case "about":         return wrap(<VoltAboutPage />)
      // brands / best-sellers have no real data backing → send to the catalogue.
      case "brands":        return redirect("/shop")
      case "best-sellers":  return redirect("/shop")
      case "categories":    return wrap(<VoltCategoriesLivePage categories={categories} />)
      case "new-launches":  return wrap(<VoltNewLaunchesLivePage products={mapProducts(getNewArrivals(navProducts))} />)
      // Contact was merged into the About page — redirect old links there.
      case "contact":       return redirect("/about")
      case "faq":           return wrap(<VoltFaqPage />)
      case "privacy":       return wrap(<VoltPrivacyPage />)
      case "terms":         return wrap(<VoltTermsPage />)
      case "shipping":      return wrap(<VoltShippingPage />)
      case "returns":       return wrap(<VoltReturnsPage />)
      case "warranty":      return wrap(<VoltWarrantyPage />)
      case "confirmation":  return wrap(<VoltConfirmationPage />)
    }
  }

  // ── GLOW ──
  if (template === "glow") {
    const toGlowProduct = (p: StoreProduct): GlowProduct => ({
      id: p.id, name: p.title, subtitle: p.description?.slice(0, 60) ?? "",
      category: "Skincare", price: p.variants?.find(v => v.calculated_price?.calculated_amount != null)?.calculated_price?.calculated_amount ?? 0,
      image: p.thumbnail ?? "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
      hoverImage: p.thumbnail ?? "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
      rating: 4.5, reviews: 128, skinTypes: [], concerns: [], description: p.description ?? "", keyIngredients: [], size: "",
    })
    const products = tenant ? await listTenantProducts(tenant) : []
    const glowProducts = products.map(toGlowProduct)

    if (slug.startsWith("products/")) {
      const productId = slug.slice("products/".length)
      const product = glowProducts.find(p => p.id === productId)
      if (!product) return notFound()
      const related = glowProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)
      return <GlowProductDetailClient product={product} related={related} config={config} />
    }

    switch (slug) {
      case "shop":      return <GlowShopClient config={config} products={glowProducts} />
      case "cart":      return <GlowCartClient config={config} />
      case "checkout":  return <GlowCheckoutClient config={config} />
      case "about":     return <GlowAboutClient config={config} />
    }
  }

  // ── THREAD ──
  if (template === "thread") {
    const wrap = (node: React.ReactNode) => (
      <TemplateConfigProvider config={config} basePath="" cartCount={cartCount} hasDeals={hasDeals} categories={categories}>
        {node}
      </TemplateConfigProvider>
    )
    switch (slug) {
      // /products is Thread's catalogue — the real themed listing lives at /shop.
      case "products":     return redirect("/shop")
      case "cart":         return wrap(<ThreadCartPage />)
      case "checkout":     return wrap(<ThreadCheckoutPage />)
      case "about":        return wrap(<ThreadAboutPage />)
      case "categories":   return wrap(<ThreadCategoriesLivePage categories={categories} />)
      // Contact was merged into the About page — redirect old links there.
      case "contact":      return redirect("/about")
      case "faq":          return wrap(<ThreadFaqPage />)
      case "privacy":      return wrap(<ThreadPrivacyPage />)
      case "terms":        return wrap(<ThreadTermsPage />)
      case "returns":      return wrap(<ThreadReturnsPage />)
      case "confirmation": return wrap(<ThreadConfirmationPage />)
    }
  }

  // ── AURUM ──
  if (template === "aurum") {
    const wrap = (node: React.ReactNode) => (
      <TemplateConfigProvider config={config} basePath="" cartCount={cartCount} hasDeals={hasDeals} categories={categories}>
        {node}
      </TemplateConfigProvider>
    )
    switch (slug) {
      case "shop":          return wrap(<AurumShopPage />)
      case "cart":          return wrap(<AurumCartPage />)
      case "checkout":      return wrap(<AurumCheckoutPage />)
      case "about":         return wrap(<AurumAboutPage />)
      case "collections":   return wrap(<AurumCollectionsLivePage collections={resolveCollections(navProducts)} />)
      case "new-arrivals":  return wrap(<AurumNewArrivalsLivePage products={mapProducts(getNewArrivals(navProducts))} />)
      // bridal / gifts are curated edits with no real backing → catalogue.
      case "bridal":        return redirect("/shop")
      case "gifts":         return redirect("/shop")
      case "contact":       return wrap(<AurumContactPage />)
      case "faq":           return wrap(<AurumFaqPage />)
      case "privacy":       return wrap(<AurumPrivacyPage />)
      case "terms":         return wrap(<AurumTermsPage />)
      case "returns":       return wrap(<AurumReturnsPage />)
      case "shipping":      return wrap(<AurumShippingPage />)
      case "store-locator": return wrap(<AurumStoreLocatorPage />)
      case "certification": return wrap(<AurumCertificationPage />)
      case "care-guide":    return wrap(<AurumCareGuidePage />)
      case "confirmation":  return wrap(<AurumConfirmationPage />)
    }
  }

  // ── EVENTPASS ──
  if (template === "eventpass") {
    const wrap = (node: React.ReactNode) => (
      <TemplateConfigProvider config={config} basePath="" cartCount={cartCount} hasDeals={hasDeals} categories={categories}>
        {node}
      </TemplateConfigProvider>
    )
    switch (slug) {
      // /events is the eventpass catalogue — the real themed listing is /shop.
      case "events":       return redirect("/shop")
      case "cart":         return wrap(<EventpassCartPage />)
      case "checkout":     return wrap(<EventpassCheckoutPage />)
      case "about":        return wrap(<EventpassAboutPage />)
      case "categories":   return wrap(<EventpassCategoriesLivePage categories={categories} />)
      // Contact was merged into the About page — redirect old links there.
      case "contact":      return redirect("/about")
      case "faq":          return wrap(<EventpassFaqPage />)
      case "privacy":      return wrap(<EventpassPrivacyPage />)
      case "terms":        return wrap(<EventpassTermsPage />)
      case "refund":       return wrap(<EventpassRefundPage />)
      case "confirmation": return wrap(<EventpassConfirmationPage />)
    }
  }

  return notFound()
}
