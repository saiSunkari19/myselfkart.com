"use client"

import Link from "next/link"
import { PageLoader, Footer, GoldDivider, Reveal } from "./_components"
import { GlowLiveNav, GlowLiveProductCard } from "./_live"
import type { ShopProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/** Glow "Shop All" slot — catalogue + optional tag-category filter. */
export function GlowShopLivePage({ config, products, categories, collections, activeCategory }: ShopProps) {
  const storeName = config?.store_name ?? "glow."
  const activeName = activeCategory
    ? [...collections, ...categories].find(c => c.id === activeCategory)?.name
    : null

  return (
    <div className={s.page}>
      <PageLoader />
      <GlowLiveNav config={config} hasDeals={false} categories={categories} />
      <div className={s.headerSpacer} />
      <section className={s.section}>
        <div className={s.container}>
          <Reveal>
            <div className={s.sectionCenter}>
              <span className={s.sectionLabel}>{activeName ? "Category" : "Full Range"}</span>
              <h2 className={s.sectionTitle}>{activeName ?? `Shop ${storeName}`}</h2>
              <GoldDivider />
            </div>
          </Reveal>

          {collections.length > 0 && (
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
              <span className={s.navLink} style={{ fontWeight: 700, opacity: 0.55 }}>Collections</span>
              {collections.map(col => (
                <Link key={col.id} href={col.href} className={s.navLink} style={{ fontWeight: activeCategory === col.id ? 700 : 400 }}>
                  {col.name} ({col.count})
                </Link>
              ))}
            </div>
          )}

          {categories.length > 0 && (
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
              <Link href="/shop" className={s.navLink} style={{ fontWeight: activeCategory ? 400 : 700 }}>All</Link>
              {categories.map(c => (
                <Link key={c.id} href={c.href} className={s.navLink} style={{ fontWeight: activeCategory === c.id ? 700 : 400 }}>
                  {c.name} ({c.count})
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <p className={s.sectionSub} style={{ textAlign: "center" }}>No products are available yet.</p>
          ) : (
            <div className={s.productsGrid}>
              {products.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}><GlowLiveProductCard product={p} index={i} /></Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer storeName={storeName} />
    </div>
  )
}
