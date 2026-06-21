"use client"

import Link from "next/link"
import { PageLoader, Footer, Reveal } from "./_components"
import { LiveProductCard, VoltNav, viewToVolt } from "./_live"
import type { ShopProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/**
 * Volt "Shop All" slot — the tenant's catalogue with an optional category
 * filter. Filtering happens in the route (which knows the raw products); this
 * slot just renders the `ShopProps` view models it is handed.
 */
export function VoltShopLivePage({ config, products: productViews, categories, activeCategory }: ShopProps) {
  const storeName = config?.store_name ?? "VOLT"
  const products = productViews.map(viewToVolt)
  const activeName = activeCategory ? categories.find(c => c.id === activeCategory)?.name : null

  const colorOverrides = {
    ...(config?.accent_color ? { "--accent": config.accent_color } : {}),
    ...(config?.primary_color ? { "--text": config.primary_color } : {}),
    ...(config?.secondary_color ? { "--bg2": config.secondary_color } : {}),
  } as React.CSSProperties

  return (
    <div className={s.pageShell} style={colorOverrides}>
      <PageLoader />
      <VoltNav config={config} hasDeals={false} categories={categories} />
      <div className={s.main}>
        {categories.length > 0 && (
          <div className={s.categoryBar}>
            <div className={s.categoryBarInner}>
              <Link href="/shop" className={`${s.categoryBarItem} ${!activeCategory ? s.categoryBarItemActive : ""}`}>All</Link>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={cat.href}
                  className={`${s.categoryBarItem} ${activeCategory === cat.id ? s.categoryBarItemActive : ""}`}
                >
                  {cat.name} ({cat.count})
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className={s.container}>
          <section className={s.section}>
            <Reveal>
              <div className={s.sectionHead}>
                <div className={s.sectionTitle}>{activeName ?? `All Products · ${storeName}`}</div>
                <span className={s.viewAll} style={{ cursor: "default" }}>
                  {products.length} {products.length === 1 ? "item" : "items"}
                </span>
              </div>
            </Reveal>
            {products.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text3)", padding: "40px 0" }}>
                No products are available yet.
              </p>
            ) : (
              <div className={s.productGrid}>
                {products.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                    <LiveProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
