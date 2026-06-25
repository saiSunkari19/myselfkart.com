"use client"

import { useState } from "react"
import Link from "next/link"
import { AddToCart } from "../../../components/add-to-cart"
import type { PdpProps } from "../../../lib/themes/types"
import { AurumNav, AurumFooter, AurumProductCard, aurumColorVars } from "./_live"
import s from "./_styles.module.css"

/** Aurum product-detail slot — real product + real add-to-cart, Aurum-styled. */
export function AurumPdpLivePage({ config, cartCount, product, variants, related }: PdpProps) {
  const images = product.images.length > 0
    ? product.images
    : ["https://images.unsplash.com/photo-1606800052052-a08af7148866?w=900&q=90"]
  const [activeImg, setActiveImg] = useState(0)
  const inr = (a: number | null | undefined) => `₹${(a ?? 0).toLocaleString("en-IN")}`

  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.breadcrumb}>
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/shop">Shop</Link>
            <span>/</span>
            <span>{product.title}</span>
          </div>

          <div className={s.productDetail}>
            {/* Gallery — thumbs must precede the main image so CSS grid
                auto-placement keeps the 72px thumb column on the left (the
                main image is pinned to column 2; rendering it first pushes the
                auto-placed thumbs down to row 2). Mirrors the preview layout. */}
            <div className={s.productGallery}>
              {images.length > 0 && (
                <div className={s.productThumbs}>
                  {images.map((url, i) => (
                    <div
                      key={i}
                      className={`${s.productThumb} ${activeImg === i ? s.active : ""}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={url} alt={`${product.title} view ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}
              <div className={s.productMainImg}>
                <img src={images[activeImg]} alt={product.title} />
                {product.isOnSale && (
                  <span style={{ position: "absolute", top: 16, left: 16 }} className={`${s.productBadge} ${s.badgeLimited}`}>Sale</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className={s.productInfo}>
              <div className={s.productDetailCategory}>{product.tags[0] ?? "Fine Jewellery"}</div>
              <h1 className={s.productDetailName}>{product.title}</h1>
              <div className={s.productDetailPurity}>✦ BIS Hallmarked</div>

              <div className={s.productDetailPrice}>
                {inr(product.price)}
                {product.originalPrice && (
                  <span className={s.productPriceOriginal}>{inr(product.originalPrice)}</span>
                )}
              </div>
              <div className={s.productDetailPriceSub}>Inclusive of all taxes · Free insured shipping above ₹10,000</div>

              <div className={s.certBadge} style={{ marginBottom: 24 }}>
                <strong>✦</strong> This piece comes with full certification and authenticity guarantee
              </div>

              <hr className={s.productDetailDivider} />

              {product.description && <p className={s.productDetailDesc}>{product.description}</p>}

              {/* Real variant selector + add-to-cart server action, Aurum-skinned */}
              <AddToCart
                variants={variants}
                buyNow
                classes={{
                  form: s.buyForm,
                  qty: s.qtyRow,
                  qtyBtn: s.qtyBtn,
                  qtyVal: s.qtyVal,
                  actions: s.buyActions,
                  primary: `${s.btn} ${s.btnDark} ${s.btnFull} ${s.btnLg}`,
                  secondary: `${s.btn} ${s.btnOutlineGold}`,
                }}
              />

              <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
                {["🚚 Free Insured Shipping", "↩️ 30-Day Returns", "🛡️ Lifetime Exchange"].map(t => (
                  <span key={t} style={{ fontSize: 11, color: "#a09080", letterSpacing: 0.3 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>You May Also Like</span>
                  <h2 className={s.sectionTitle} style={{ fontSize: 36 }}>Related Pieces</h2>
                </div>
                <Link href="/shop" className={`${s.btn} ${s.btnOutlineGold}`}>View All</Link>
              </div>
              <div className={s.productGrid4}>
                {related.map((p, i) => <AurumProductCard key={p.id} product={p} index={i} />)}
              </div>
            </section>
          )}
        </div>
      </div>
      <AurumFooter config={config} />
    </div>
  )
}
