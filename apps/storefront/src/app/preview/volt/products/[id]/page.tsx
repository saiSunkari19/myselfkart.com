"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { PageShell, ProductCard, Stars, Badge, Reveal } from "../../_components"
import { PRODUCTS } from "../../_data"
import { useTemplateConfig } from "../../../../../lib/template-config-context"
import s from "../../_styles.module.css"

const REVIEWS = [
  { name: "Arjun K.", avatar: "A", rating: 5, date: "Dec 2024", text: "Exceptional product, delivered fast and genuine. Volt's packaging was perfect." },
  { name: "Meera P.", avatar: "M", rating: 5, date: "Nov 2024", text: "Exactly as described. Amazing quality and the price beat every other site I checked." },
  { name: "Suresh M.", avatar: "S", rating: 4, date: "Nov 2024", text: "Great product overall. Delivery was faster than expected. Minor thing — could've included a carry case." },
]

export default function ProductDetailPage() {
  const { basePath } = useTemplateConfig()
  const { id } = useParams()
  const product = PRODUCTS.find(p => p.id === id) || PRODUCTS[0]
  const related = PRODUCTS.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)
  const [activeImg, setActiveImg] = useState(0)
  const [activeTab, setActiveTab] = useState("specs")
  const [activeColor, setActiveColor] = useState(0)
  const [activeStorage, setActiveStorage] = useState(0)
  const [qty, setQty] = useState(1)

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
        <div className={s.container}>
          <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--text3)" }}>
            <Link href={basePath || "/"} style={{ color: "var(--accent)" }}>Home</Link>
            <span>/</span>
            <Link href={`${basePath}/shop`} style={{ color: "var(--accent)" }}>{product.category}</Link>
            <span>/</span>
            <span style={{ color: "var(--text)" }}>{product.name}</span>
          </div>
        </div>
      </div>

      <div className={s.container}>
        <div className={s.detailLayout}>
          {/* Gallery */}
          <div>
            <div className={s.galleryMain}>
              <img src={product.images[activeImg] || product.image} alt={product.name} style={{ transition: "opacity 0.3s" }} />
            </div>
            {product.images.length > 1 && (
              <div className={s.galleryThumbs}>
                {product.images.map((img, i) => (
                  <div key={i} className={`${s.galleryThumb} ${i === activeImg ? s.galleryThumbActive : ""}`} onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={s.detailInfo}>
            <div className={s.detailBrand}>{product.brand}</div>
            <h1 className={s.detailName}>{product.name}</h1>
            <div className={s.detailRating}>
              <Stars rating={product.rating} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{product.rating}</span>
              <span style={{ fontSize: 13, color: "var(--text3)" }}>({product.reviewCount.toLocaleString()} reviews)</span>
              <Badge type={product.badge} />
            </div>

            <div className={s.detailPrice}>
              <span className={s.detailPriceMain}>₹{product.price.toLocaleString("en-IN")}</span>
              {product.originalPrice && <span className={s.detailPriceOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>}
              {product.discount && <span className={s.detailPriceDiscount}>{product.discount}% OFF</span>}
            </div>

            {product.emi && (
              <div className={s.detailEmi}>No-cost EMI from <strong>{product.emi}</strong> · on HDFC, ICICI, Axis cards</div>
            )}

            {product.colors && (
              <div className={s.colorPicker}>
                <div className={s.colorPickerLabel}>Colour</div>
                <div className={s.colorDots}>
                  {product.colors.map((c, i) => (
                    <div key={c} className={`${s.colorDot} ${i === activeColor ? s.colorDotActive : ""}`} style={{ background: c }} onClick={() => setActiveColor(i)} />
                  ))}
                </div>
              </div>
            )}

            {product.storage && (
              <div className={s.storagePicker}>
                <div className={s.storagePickerLabel}>Storage</div>
                <div className={s.storagePills}>
                  {product.storage.map((st, i) => (
                    <button key={st} className={`${s.storagePill} ${i === activeStorage ? s.storagePillActive : ""}`} onClick={() => setActiveStorage(i)}>{st}</button>
                  ))}
                </div>
              </div>
            )}

            <div className={s.deliveryCard}>
              {[
                { icon: "📍", label: "Deliver to", value: "Enter pincode for delivery estimate" },
                { icon: "🚚", label: "Delivery", value: product.delivery || "Free delivery in 2–3 days" },
                { icon: "🛡", label: "Warranty", value: product.warranty },
                { icon: "↩️", label: "Returns", value: "10-day easy return policy" },
              ].map(r => (
                <div key={r.label} className={s.deliveryRow}>
                  <span className={s.deliveryIcon}>{r.icon}</span>
                  <span><strong>{r.label}:</strong> {r.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div className={s.qtyControl}>
                <button className={s.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className={s.qtyVal}>{qty}</span>
                <button className={s.qtyBtn} onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>✓ In Stock</span>
            </div>

            <div className={s.detailActions}>
              <Link href={`${basePath}/cart`} className={`${s.btn} ${s.btnPrimary} ${s.btnFull} ${s.btnLg}`}>Add to Cart</Link>
              <Link href={`${basePath}/checkout`} className={`${s.btn} ${s.btnDark} ${s.btnFull} ${s.btnLg}`}>Buy Now</Link>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["✅ Genuine Product", "🔒 Secure Payment", "📦 Premium Packaging"].map(t => (
                <span key={t} style={{ fontSize: 11.5, color: "var(--text3)", background: "var(--bg3)", padding: "4px 10px", borderRadius: 4 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={s.detailTabs}>
          <div className={s.tabList}>
            {[["specs", "Specifications"], ["highlights", "Highlights"], ["reviews", "Reviews"], ["qa", "Q&A"]].map(([key, label]) => (
              <button key={key} className={`${s.tab} ${activeTab === key ? s.tabActive : ""}`} onClick={() => setActiveTab(key)}>{label}</button>
            ))}
          </div>

          {activeTab === "specs" && (
            <div className={s.specTable}>
              {product.specs.map(spec => (
                <div key={spec.label} className={s.specRow}>
                  <span className={s.specLabel}>{spec.label}</span>
                  <span className={s.specValue}>{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "highlights" && (
            <ul style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 0" }}>
              {product.highlights.map(h => (
                <li key={h} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text2)", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700, marginTop: 1 }}>✓</span> {h}
                </li>
              ))}
            </ul>
          )}

          {activeTab === "reviews" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {REVIEWS.map(r => (
                <div key={r.name} className={s.reviewCard}>
                  <div className={s.reviewHeader}>
                    <div className={s.reviewAvatar}>{r.avatar}</div>
                    <div>
                      <div className={s.reviewName}>{r.name}</div>
                      <Stars rating={r.rating} />
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)" }}>{r.date}</span>
                  </div>
                  <p className={s.reviewText}>{r.text}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "qa" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { q: "Does this come with a warranty card?", a: "Yes, a manufacturer warranty card and invoice are included in the box." },
                { q: "Is this the Indian variant?", a: "Yes, Volt only sells official Indian variants with full brand warranty." },
              ].map(item => (
                <div key={item.q} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Q: {item.q}</div>
                  <div style={{ fontSize: 13.5, color: "var(--text2)" }}>A: {item.a}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className={s.section}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>More Options</span>
                  <div className={s.sectionTitle}>Related Products</div>
                </div>
              </div>
            </Reveal>
            <div className={s.productGrid}>
              {related.slice(0, 4).map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  )
}
