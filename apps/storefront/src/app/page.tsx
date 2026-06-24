import { redirect } from "next/navigation"
import Link from "next/link"

import { StorefrontStatePage } from "../components/storefront-state"
import { formatMoney } from "../lib/format"
import { THEMES, getTheme } from "../lib/themes"
import { mapProducts, resolveCategories, resolveCollections } from "../lib/views"
import { getDeals, getNewArrivals } from "../lib/merchandising"
import { listTenantProducts } from "../lib/medusa/products"
import { isStorefrontDemoHost, resolveTenant } from "../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../lib/store-config"
import { getCartItemCount } from "../lib/cart/item-count"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const tenant = await resolveTenant()

  if (!tenant) {
    // The tenant-less platform/OAuth-broker host has no store of its own — serve
    // the public glow demo there instead of "store not found" so visitors can
    // walk a full store flow. Only the home route redirects; /auth/google/* and
    // other routes on this host are untouched.
    if (await isStorefrontDemoHost()) {
      redirect("/preview/glow")
    }
    return <StorefrontStatePage state="not-found" />
  }

  if (tenant.status === "draft") {
    return <StorefrontStatePage state="draft" />
  }

  if (tenant.status === "suspended") {
    return <StorefrontStatePage state="suspended" />
  }

  const [products, config, cartCount] = await Promise.all([
    listTenantProducts(tenant),
    fetchStoreConfig(tenant),
    getCartItemCount(tenant),
  ])

  // Every storefront template is now ported into the theme registry (volt, glow,
  // thread, aurum, eventpass), so they render via getTheme() + view models. The
  // generic hero below is only reached by tenants with no template_id (e.g. flyr),
  // for which getTheme() would otherwise fall back to DefaultTheme's bare grid.
  if (config?.template_id && config.template_id in THEMES) {
    const Theme = getTheme(config.template_id)
    return (
      <Theme.Home
        config={config}
        cartCount={cartCount}
        products={mapProducts(products)}
        categories={resolveCategories(products)}
        collections={resolveCollections(products)}
        deals={mapProducts(getDeals(products))}
        newArrivals={mapProducts(getNewArrivals(products))}
      />
    )
  }

  const heroCta = config?.hero_cta
  const freeShipping = config?.free_shipping_threshold

  return (
    <main>
      {/* Hero */}
      {(config?.hero_heading || config?.hero_subtext) && (
        <section
          style={{
            background: config.hero_image_url
              ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${config.hero_image_url}) center/cover no-repeat`
              : "var(--store-primary)",
            color: "#fff",
            borderRadius: 12,
            padding: "clamp(2.5rem, 8vw, 5rem) clamp(1.5rem, 5vw, 3rem)",
            marginBottom: "2rem",
          }}
        >
          {config.hero_heading && (
            <h1
              style={{
                margin: "0 0 0.5rem",
                fontSize: "clamp(1.75rem, 5vw, 3rem)",
                fontWeight: 700,
                fontFamily: "var(--store-font-heading)",
                lineHeight: 1.1,
              }}
            >
              {config.hero_heading}
            </h1>
          )}
          {config.hero_subtext && (
            <p
              style={{
                margin: "0 0 1.5rem",
                fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
                opacity: 0.9,
              }}
            >
              {config.hero_subtext}
            </p>
          )}
          {heroCta && (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href={heroCta.primary_link}
                style={{
                  background: "#fff",
                  color: "var(--store-primary)",
                  padding: "0.6rem 1.4rem",
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.95rem",
                }}
              >
                {heroCta.primary_label}
              </Link>
              {heroCta.secondary_label && heroCta.secondary_link && (
                <Link
                  href={heroCta.secondary_link}
                  style={{
                    border: "2px solid rgba(255,255,255,0.7)",
                    color: "#fff",
                    padding: "0.6rem 1.4rem",
                    borderRadius: 8,
                    fontWeight: 600,
                    textDecoration: "none",
                    fontSize: "0.95rem",
                  }}
                >
                  {heroCta.secondary_label}
                </Link>
              )}
            </div>
          )}
        </section>
      )}

      {/* Products */}
      <h2
        style={{
          fontFamily: "var(--store-font-heading)",
          fontWeight: 700,
          margin: "0 0 0.25rem",
        }}
      >
        Products
      </h2>
      {freeShipping != null && (
        <p style={{ margin: "0 0 1rem", color: "var(--store-primary)", fontWeight: 500, fontSize: "0.9rem" }}>
          Free shipping on orders above ₹{freeShipping.toLocaleString("en-IN")}
        </p>
      )}

      {products.length === 0 ? (
        <p className="state">No products are available yet.</p>
      ) : (
        <ul className="product-grid">
          {products.map((product) => {
            const price = product.variants?.find(
              (v) => v.calculated_price?.calculated_amount != null
            )?.calculated_price
            return (
              <li key={product.id} className="product-card">
                <Link href={product.handle ? `/products/${product.handle}` : "#"}>
                  {product.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.thumbnail} alt={product.title} />
                  ) : null}
                  <strong>{product.title}</strong>
                  {price ? (
                    <span className="price">
                      {formatMoney(price.calculated_amount, price.currency_code)}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
