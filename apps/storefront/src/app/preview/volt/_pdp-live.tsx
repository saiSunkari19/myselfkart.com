"use client"

import { useState } from "react"
import Link from "next/link"
import { AddToCart } from "../../../components/add-to-cart"
import { PageLoader, Footer, Reveal, Stars } from "./_components"
import { LiveProductCard, VoltNav, viewToVolt } from "./_live"
import type { PdpProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/** A delivery-card row: only rendered when it has a value. */
type InfoRow = { icon: string; label: string; value: string | null }

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

  // Delivery card — delivery comes from the store's free-shipping rule, warranty
  // and returns from the product (returns falls back to a sensible default).
  const deliveryText = config?.free_shipping_threshold
    ? `Free delivery on orders above ₹${config.free_shipping_threshold.toLocaleString("en-IN")}`
    : "Standard delivery in 3–5 days"
  const returnsText = product.returnsPolicy ?? "10-day easy return policy"
  const infoRows: InfoRow[] = [
    { icon: "📍", label: "Deliver to", value: "Enter pincode for delivery estimate" },
    { icon: "🚚", label: "Delivery", value: deliveryText },
    { icon: "🛡", label: "Warranty", value: product.warranty },
    { icon: "↩️", label: "Returns", value: returnsText },
  ]

  return (
    <div className={s.pageShell} style={colorOverrides}>
      <PageLoader />
      <VoltNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />

      {/* Breadcrumb bar — flex on the wrapper keeps crumbs inline (do NOT put a
          flex class on the links, or each crumb stacks onto its own line). */}
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
        <div className={s.container}>
          <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--text3)" }}>
            <Link href="/" style={{ color: "var(--accent)" }}>Home</Link>
            <span>/</span>
            <Link href="/shop" style={{ color: "var(--accent)" }}>Shop</Link>
            <span>/</span>
            <span style={{ color: "var(--text)" }}>{product.title}</span>
          </div>
        </div>
      </div>

      <div className={s.main}>
        <div className={s.container}>
          <div className={s.detailLayout}>
            {/* Gallery */}
            <div>
              <div className={s.galleryMain}>
                {images.length > 0
                  ? <img src={images[activeImage]} alt={product.title} />
                  : <div style={{ aspectRatio: "1", display: "grid", placeItems: "center", fontSize: 48 }}>🛍️</div>}
              </div>
              {images.length > 1 && (
                <div className={s.galleryThumbs}>
                  {images.map((url, i) => (
                    <div
                      key={i}
                      className={`${s.galleryThumb} ${i === activeImage ? s.galleryThumbActive : ""}`}
                      onClick={() => setActiveImage(i)}
                    >
                      <img src={url} alt={`${product.title} view ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className={s.detailInfo}>
              {product.tags[0] && <div className={s.detailBrand}>{product.tags[0]}</div>}
              <h1 className={s.detailName}>{product.title}</h1>

              {product.rating != null && (
                <div className={s.detailRating}>
                  <Stars rating={product.rating} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{product.rating}</span>
                  {product.reviewCount != null && (
                    <span style={{ fontSize: 13, color: "var(--text3)" }}>
                      ({product.reviewCount.toLocaleString("en-IN")} reviews)
                    </span>
                  )}
                </div>
              )}

              <div className={s.detailPrice}>
                {priceLabel && <span className={s.detailPriceMain}>{priceLabel}</span>}
                {product.originalPrice && (
                  <span className={s.detailPriceOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
                )}
                {product.discountPercent > 0 && (
                  <span className={s.detailPriceDiscount}>{product.discountPercent}% OFF</span>
                )}
              </div>

              {product.description && (
                <p style={{ fontSize: 14, color: "var(--text2,#475569)", lineHeight: 1.7, marginBottom: 20 }}>
                  {product.description}
                </p>
              )}

              <div className={s.deliveryCard}>
                {infoRows
                  .filter(r => r.value)
                  .map(r => (
                    <div key={r.label} className={s.deliveryRow}>
                      <span className={s.deliveryIcon}>{r.icon}</span>
                      <span><strong>{r.label}:</strong> {r.value}</span>
                    </div>
                  ))}
              </div>

              <AddToCart variants={variants} />
            </div>
          </div>

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
