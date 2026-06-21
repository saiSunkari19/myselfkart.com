"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { PageShell, ProductCard, Reveal, GoldDivider, NewsletterSection } from "../../_components"
import { PRODUCTS } from "../../_data"
import s from "../../_styles.module.css"
import { useTemplateConfig } from "../../../../../lib/template-config-context"

const REVIEWS = [
  { name: "Anita S.", date: "March 2026", stars: 5, text: "Absolutely breathtaking. The quality is unmatched and the certificate gave me full confidence. Delivery was fast and the packaging was museum-quality.", product: "Verified Purchase" },
  { name: "Rajesh M.", date: "February 2026", stars: 5, text: "Gifted this to my wife on our anniversary. She hasn't stopped wearing it. The craftsmanship is extraordinary — exactly as described. Worth every rupee.", product: "Verified Purchase" },
  { name: "Priya K.", date: "January 2026", stars: 5, text: "The certificate made all the difference. Knowing it's properly certified and hallmarked gave me complete peace of mind. Beautiful piece.", product: "Verified Purchase" },
]

export default function ProductDetailPage() {
  const { basePath } = useTemplateConfig()
  const { id } = useParams()
  const product = PRODUCTS.find(p => p.id === id) ?? PRODUCTS[0]
  const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)

  const [activeImg, setActiveImg] = useState(0)
  const [activeSize, setActiveSize] = useState(product.sizes?.[1] ?? "")
  const [added, setAdded] = useState(false)
  const [tab, setTab] = useState<"details" | "care" | "shipping">("details")

  const handleAdd = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <PageShell>
      <div className={s.container}>
        {/* Breadcrumb */}
        <div className={s.breadcrumb}>
          <Link href={basePath || "/"}>Home</Link>
          <span>/</span>
          <Link href={`${basePath}/shop`}>Shop</Link>
          <span>/</span>
          <Link href={`${basePath}/shop`}>{product.category}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        {/* Main layout */}
        <div className={s.productDetail}>
          {/* Gallery */}
          <div className={s.productGallery}>
            <div className={s.productThumbs}>
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className={`${s.productThumb} ${activeImg === i ? s.active : ""}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={img} alt={`View ${i + 1}`} />
                </div>
              ))}
            </div>
            <div className={s.productMainImg}>
              <img src={product.images[activeImg]} alt={product.name} />
              <div className={s.productZoomHint}>Hover to zoom</div>
              {product.badge && (
                <span style={{ position: "absolute", top: 16, left: 16 }}
                  className={`${s.productBadge} ${
                    product.badge === "New" ? s.badgeNew :
                    product.badge === "Bestseller" ? s.badgeBestseller :
                    product.badge === "Limited" ? s.badgeLimited : s.badgeBridal
                  }`}>{product.badge}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className={s.productInfo}>
            <div className={s.productDetailCategory}>{product.collection}</div>
            <h1 className={s.productDetailName}>{product.name}</h1>
            {product.purity && <div className={s.productDetailPurity}>✦ {product.purity}</div>}

            <div className={s.productDetailPrice}>
              ₹{product.price.toLocaleString("en-IN")}
              {product.originalPrice && (
                <span className={s.productPriceOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
              )}
            </div>
            <div className={s.productDetailPriceSub}>Inclusive of all taxes · Free insured shipping above ₹10,000</div>

            {product.certified && (
              <div className={s.certBadge} style={{ marginBottom: 24 }}>
                <strong>✦</strong> This piece comes with full certification and authenticity guarantee
              </div>
            )}

            <hr className={s.productDetailDivider} />

            {/* Sizes */}
            {product.sizes && (
              <>
                <div className={s.selectorLabel}>
                  Size — <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{activeSize}</span>
                </div>
                <div className={s.sizePills}>
                  {product.sizes.map(sz => (
                    <button
                      key={sz}
                      className={`${s.sizePill} ${activeSize === sz ? s.active : ""}`}
                      onClick={() => setActiveSize(sz)}
                    >{sz}</button>
                  ))}
                </div>
              </>
            )}

            {/* CTA */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <button
                className={`${s.btn} ${added ? s.btnGold : s.btnDark} ${s.btnFull} ${s.btnLg}`}
                onClick={handleAdd}
              >
                {added ? "✓ Added to Bag" : "Add to Bag"}
              </button>
              <Link href={`${basePath}/cart`} className={`${s.btn} ${s.btnOutlineGold}`} style={{ padding: "14px 20px" }}>
                View Bag
              </Link>
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
              {["🚚 Free Insured Shipping", "↩️ 30-Day Returns", "🛡️ Lifetime Exchange"].map(t => (
                <span key={t} style={{ fontSize: 11, color: "#a09080", letterSpacing: 0.3 }}>{t}</span>
              ))}
            </div>

            <hr className={s.productDetailDivider} />

            {/* Description */}
            <p className={s.productDetailDesc}>{product.description}</p>

            {/* Highlights */}
            <div className={s.selectorLabel} style={{ marginBottom: 12 }}>Highlights</div>
            <ul className={s.productHighlights}>
              {product.highlights.map(h => <li key={h}>{h}</li>)}
            </ul>

            <hr className={s.productDetailDivider} />

            {/* Tab selector */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e8e0d4", marginBottom: 24 }}>
              {(["details", "care", "shipping"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "12px 24px",
                    background: "none",
                    border: "none",
                    borderBottom: tab === t ? "2px solid #b8962e" : "2px solid transparent",
                    marginBottom: -1,
                    font: "inherit",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: tab === t ? "#b8962e" : "#a09080",
                    cursor: "pointer",
                    transition: "color 0.15s",
                  }}
                >
                  {t === "details" ? "Product Details" : t === "care" ? "Care Guide" : "Shipping & Returns"}
                </button>
              ))}
            </div>

            {tab === "details" && (
              <table className={s.productDetailTable}>
                <tbody>
                  {product.details.map(d => (
                    <tr key={d.label}>
                      <td>{d.label}</td>
                      <td>{d.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "care" && (
              <div style={{ fontSize: 13, color: "#6b5f52", lineHeight: 1.85 }}>
                <p>Store your jewellery in the provided box or a soft pouch when not wearing. Keep pieces separate to avoid scratches.</p>
                <p>Clean gold jewellery with a soft cloth dampened with warm soapy water. Rinse thoroughly and dry completely before storing.</p>
                <p>Remove jewellery before swimming, bathing, or applying perfume. Chemicals in chlorine and cosmetics can affect the finish over time.</p>
                <p>Have your jewellery professionally cleaned and inspected at an Aurum store once a year to maintain its brilliance.</p>
              </div>
            )}

            {tab === "shipping" && (
              <div style={{ fontSize: 13, color: "#6b5f52", lineHeight: 1.85 }}>
                <p><strong style={{ color: "#1a1410" }}>Free insured shipping</strong> on all orders above ₹10,000. Standard delivery: 3–5 business days. Express: 1–2 business days.</p>
                <p><strong style={{ color: "#1a1410" }}>30-day returns.</strong> Return any piece within 30 days in its original condition. We'll arrange pickup from your doorstep.</p>
                <p><strong style={{ color: "#1a1410" }}>Lifetime exchange.</strong> Exchange your Aurum jewellery at full current gold value at any of our stores, any time.</p>
                <p>All orders are shipped in tamper-evident, GPS-tracked packaging with full insurance coverage for the declared value.</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {REVIEWS.length > 0 && (
          <Reveal>
            <div className={s.reviewsWrap}>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>Customer Experiences</span>
                  <h2 className={s.sectionTitle} style={{ fontSize: 32 }}>Reviews</h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 40, fontWeight: 300, color: "#1a1410" }}>5.0</div>
                  <div style={{ color: "#b8962e", letterSpacing: 2 }}>★★★★★</div>
                  <div style={{ fontSize: 12, color: "#a09080", marginTop: 4 }}>{REVIEWS.length} reviews</div>
                </div>
              </div>
              {REVIEWS.map((r, i) => (
                <div key={i} className={s.reviewCard}>
                  <div className={s.reviewHeader}>
                    <div>
                      <div className={s.reviewerName}>{r.name}</div>
                      <div className={s.reviewStars}>{"★".repeat(r.stars)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className={s.reviewerDate}>{r.date}</div>
                      <div className={s.reviewProduct}>{r.product}</div>
                    </div>
                  </div>
                  <p className={s.reviewText}>{r.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className={s.section}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>You May Also Like</span>
                  <h2 className={s.sectionTitle} style={{ fontSize: 36 }}>Related Pieces</h2>
                </div>
                <Link href={`${basePath}/shop`} className={`${s.btn} ${s.btnOutline}`}>View All</Link>
              </div>
            </Reveal>
            <div className={s.productGrid4}>
              {related.map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 4) as 0|1|2|3} />)}
            </div>
          </section>
        )}
      </div>
      <NewsletterSection />
    </PageShell>
  )
}
