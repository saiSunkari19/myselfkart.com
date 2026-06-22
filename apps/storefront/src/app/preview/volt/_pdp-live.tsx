"use client"

import { useState } from "react"
import Link from "next/link"
import { AddToCart } from "../../../components/add-to-cart"
import { PageLoader, Footer, Reveal } from "./_components"
import { LiveProductCard, VoltNav, viewToVolt } from "./_live"
import type { PdpProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/** Volt product-detail slot — real product + add-to-cart, themed in Volt. */
export function VoltPdpLivePage({ config, cartCount, product, variants, related }: PdpProps) {
  const relatedCards = related.map(viewToVolt)
  const [activeImage, setActiveImage] = useState(0)
  const images = product.images

  const colorOverrides = {
    ...(config?.accent_color ? { "--accent": config.accent_color } : {}),
    ...(config?.primary_color ? { "--text": config.primary_color } : {}),
    ...(config?.secondary_color ? { "--bg2": config.secondary_color } : {}),
  } as React.CSSProperties

  const priceLabel = product.price != null ? `₹${product.price.toLocaleString("en-IN")}` : null

  return (
    <div className={s.pageShell} style={colorOverrides}>
      <PageLoader />
      <VoltNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.main}>
        <div className={s.container}>
          <div style={{ fontSize: 13, color: "var(--text3)", padding: "20px 0" }}>
            <Link href="/" className={s.viewAll} style={{ marginRight: 6 }}>Home</Link> /{" "}
            <Link href="/shop" className={s.viewAll} style={{ margin: "0 6px" }}>Shop</Link> /{" "}
            <span style={{ marginLeft: 6 }}>{product.title}</span>
          </div>

          <section className={s.section} style={{ paddingTop: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
              <div>
                <div className={s.productCardImg} style={{ borderRadius: 16, overflow: "hidden", background: "var(--bg2,#f1f5f9)" }}>
                  {images.length > 0
                    ? <img src={images[activeImage]} alt={product.title} style={{ width: "100%", objectFit: "cover" }} />
                    : <div style={{ aspectRatio: "1", display: "grid", placeItems: "center", fontSize: 48 }}>🛍️</div>}
                </div>
                {images.length > 1 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {images.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        style={{
                          width: 56, height: 56, borderRadius: 8, overflow: "hidden", padding: 0, cursor: "pointer",
                          border: activeImage === i ? "2px solid var(--accent)" : "1px solid var(--border)",
                          background: "var(--bg2,#f1f5f9)",
                        }}
                      >
                        <img src={url} alt={`${product.title} view ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {product.tags[0] && <div className={s.productCardBrand}>{product.tags[0]}</div>}
                <h1 className={s.sectionTitle} style={{ fontSize: 30, marginBottom: 12 }}>{product.title}</h1>
                <div className={s.productCardPrice} style={{ marginBottom: 16 }}>
                  {priceLabel && <span className={s.priceMain} style={{ fontSize: 26 }}>{priceLabel}</span>}
                  {product.originalPrice && (
                    <span className={s.priceOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
                  )}
                  {product.discountPercent > 0 && (
                    <span className={s.priceDiscount}>{product.discountPercent}% off</span>
                  )}
                </div>
                {product.description && (
                  <p style={{ fontSize: 14, color: "var(--text2,#475569)", lineHeight: 1.7, marginBottom: 24 }}>
                    {product.description}
                  </p>
                )}
                <AddToCart variants={variants} />
              </div>
            </div>
          </section>

          {relatedCards.length > 0 && (
            <section className={s.section}>
              <Reveal>
                <div className={s.sectionHead}>
                  <div className={s.sectionTitle}>You may also like</div>
                  <Link href="/shop" className={s.viewAll}>View All →</Link>
                </div>
              </Reveal>
              <div className={s.productGrid}>
                {relatedCards.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                    <LiveProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
