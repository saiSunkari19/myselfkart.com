"use client"

import Link from "next/link"
import { AddToCart } from "../../../components/add-to-cart"
import { PageLoader, Footer, GoldDivider, Reveal } from "./_components"
import { GlowLiveNav, GlowLiveProductCard } from "./_live"
import type { PdpProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/** Glow product-detail slot — real product + add-to-cart, glow-styled. */
export function GlowPdpLivePage({ config, product, variants, related }: PdpProps) {
  const storeName = config?.store_name ?? "glow."
  const img = product.thumbnail ?? "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=85"
  const priceLabel = product.price != null ? `₹${product.price.toLocaleString("en-IN")}` : null

  return (
    <div className={s.page}>
      <PageLoader />
      <GlowLiveNav config={config} hasDeals={false} categories={[]} />
      <div className={s.headerSpacer} />
      <section className={s.section}>
        <div className={s.container}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
            <div className={s.productImageWrap} style={{ borderRadius: 16, overflow: "hidden" }}>
              <img src={img} alt={product.title} className={s.productImg} />
            </div>
            <div>
              <div className={s.productCategory}>{product.tags[0] ?? "Skincare"}</div>
              <h1 className={s.sectionTitle} style={{ textAlign: "left", fontSize: 32 }}>{product.title}</h1>
              <div style={{ margin: "12px 0 20px" }}>
                {priceLabel && <span className={s.productPrice} style={{ fontSize: 24 }}>{priceLabel}</span>}
                {product.originalPrice && (
                  <span className={s.productOriginal} style={{ marginLeft: 10 }}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
                )}
              </div>
              {product.description && <p className={s.sectionSub} style={{ textAlign: "left", marginBottom: 24 }}>{product.description}</p>}
              <AddToCart variants={variants} />
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className={s.section} style={{ background: "var(--beige)" }}>
          <div className={s.container}>
            <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel}>You may also like</span><h2 className={s.sectionTitle}>More from {storeName}</h2><GoldDivider /></div></Reveal>
            <div className={s.productsGrid}>
              {related.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}><GlowLiveProductCard product={p} index={i} /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
      <Footer storeName={storeName} />
    </div>
  )
}
