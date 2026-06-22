"use client"

import { useState } from "react"
import Link from "next/link"
import { AddToCart } from "../../../components/add-to-cart"
import type { PdpProps } from "../../../lib/themes/types"
import { ThreadNav, ThreadFooter, ThreadProductCard, threadColorVars } from "./_live"
import s from "./_styles.module.css"

/** Thread product-detail slot — real product + real add-to-cart, thread-styled. */
export function ThreadPdpLivePage({ config, cartCount, product, variants, related }: PdpProps) {
  const images = product.images.length > 0
    ? product.images
    : ["https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=85"]
  const [activeImage, setActiveImage] = useState(0)
  const inr = (a: number | null | undefined) => `₹${(a ?? 0).toLocaleString("en-IN")}`

  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "24px 0 0", fontSize: 13, color: "#a09890" }}>
            <Link href="/" style={{ color: "#a09890", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <Link href="/shop" style={{ color: "#a09890", textDecoration: "none" }}>Shop</Link>
            <span>/</span>
            <span style={{ color: "#1a1a1a" }}>{product.title}</span>
          </div>

          <div className={s.productDetail}>
            <div className={s.productDetailImages}>
              {images.length > 1 && (
                <div className={s.productDetailThumbs}>
                  {images.map((url, i) => (
                    <div
                      key={i}
                      className={`${s.productDetailThumb} ${activeImage === i ? s.active : ""}`}
                      onClick={() => setActiveImage(i)}
                    >
                      <img src={url} alt={`${product.title} view ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}
              <div className={s.productDetailMain}>
                <img src={images[activeImage]} alt={product.title} />
              </div>
            </div>

            <div className={s.productDetailInfo}>
              <div className={s.productDetailCategory}>{product.tags[0] ?? "Apparel"}</div>
              <h1 className={s.productDetailName}>{product.title}</h1>
              <div className={s.productDetailPrice}>
                <span style={product.originalPrice ? { color: "#c4956a" } : {}}>{inr(product.price)}</span>
                {product.originalPrice && (
                  <span className={s.productPriceOriginal}>{inr(product.originalPrice)}</span>
                )}
              </div>
              {product.description && <p className={s.productDetailDesc}>{product.description}</p>}

              <hr className={s.productDetailDivider} />

              {/* Real variant selector + add-to-cart server action */}
              <div style={{ marginBottom: 32 }}>
                <AddToCart variants={variants} />
              </div>

              <hr className={s.productDetailDivider} />

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "🚚", text: "Free shipping on orders above ₹2,999" },
                  { icon: "↩️", text: "Free returns within 30 days" },
                  { icon: "📦", text: "Ships in 2–4 business days" },
                ].map(item => (
                  <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "#6b6560" }}>
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <div>
                  <div className={s.sectionLabel}>You might also like</div>
                  <h2 className={s.sectionTitle}>More to explore</h2>
                </div>
                <Link href="/shop" className={`${s.btn} ${s.btnOutline}`}>View All</Link>
              </div>
              <div className={`${s.productGrid} ${s.productGrid4}`}>
                {related.map((p, i) => <ThreadProductCard key={p.id} product={p} index={i} />)}
              </div>
            </section>
          )}
        </div>
      </div>
      <ThreadFooter config={config} />
    </div>
  )
}
