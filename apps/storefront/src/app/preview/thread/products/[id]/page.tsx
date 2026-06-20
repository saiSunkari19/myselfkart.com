"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { PageShell, ProductCard, NewsletterSection } from "../../_components"
import { PRODUCTS } from "../../_data"
import s from "../../_styles.module.css"

export default function ProductDetailPage() {
  const { id } = useParams()
  const product = PRODUCTS.find(p => p.id === id) ?? PRODUCTS[0]
  const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)

  const [activeImage, setActiveImage] = useState(0)
  const [activeSize, setActiveSize] = useState(product.sizes[1] ?? product.sizes[0])
  const [activeColor, setActiveColor] = useState(0)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <PageShell>
      <div className={s.container}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "24px 0 0", fontSize: 13, color: "#a09890" }}>
          <Link href="/preview/thread" style={{ color: "#a09890", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/preview/thread/products" style={{ color: "#a09890", textDecoration: "none" }}>Shop</Link>
          <span>/</span>
          <span style={{ color: "#1a1a1a" }}>{product.name}</span>
        </div>

        {/* Product Detail */}
        <div className={s.productDetail}>
          {/* Images */}
          <div className={s.productDetailImages}>
            <div className={s.productDetailThumbs}>
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className={`${s.productDetailThumb} ${activeImage === i ? s.active : ""}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img} alt={`${product.name} view ${i + 1}`} />
                </div>
              ))}
            </div>
            <div className={s.productDetailMain}>
              <img src={product.images[activeImage]} alt={product.name} />
            </div>
          </div>

          {/* Info */}
          <div className={s.productDetailInfo}>
            <div className={s.productDetailCategory}>{product.category}</div>
            <h1 className={s.productDetailName}>{product.name}</h1>
            <div className={s.productDetailPrice}>
              <span style={product.originalPrice ? { color: "#c4956a" } : {}}>
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className={s.productPriceOriginal}>₹{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
            <p className={s.productDetailDesc}>{product.description}</p>

            <hr className={s.productDetailDivider} />

            {/* Color */}
            <div className={s.selectorLabel}>
              Colour — <span style={{ color: "#6b6560", textTransform: "none", fontWeight: 500 }}>{product.colors[activeColor].name}</span>
            </div>
            <div className={s.colorDots}>
              {product.colors.map((color, i) => (
                <button
                  key={color.name}
                  title={color.name}
                  className={`${s.colorDot} ${activeColor === i ? s.active : ""}`}
                  style={{ background: color.hex }}
                  onClick={() => setActiveColor(i)}
                />
              ))}
            </div>

            {/* Size */}
            <div className={s.selectorLabel}>
              Size — <span style={{ color: "#6b6560", textTransform: "none", fontWeight: 500 }}>{activeSize}</span>
            </div>
            <div className={s.sizePills}>
              {product.sizes.map(sz => (
                <button
                  key={sz}
                  className={`${s.sizePill} ${activeSize === sz ? s.active : ""}`}
                  onClick={() => setActiveSize(sz)}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
              <button
                className={`${s.btn} ${s.btnFull} ${added ? s.btnAccent : ""}`}
                onClick={handleAdd}
              >
                {added ? "Added to Bag ✓" : "Add to Bag"}
              </button>
              <Link href="/preview/thread/cart" className={`${s.btn} ${s.btnOutline}`}>
                View Bag
              </Link>
            </div>

            <hr className={s.productDetailDivider} />

            {/* Details */}
            <div className={s.selectorLabel} style={{ marginBottom: 12 }}>Product Details</div>
            <ul className={s.productDetailDetails}>
              {product.details.map(d => <li key={d}>{d}</li>)}
            </ul>

            <hr className={s.productDetailDivider} />

            {/* Shipping info */}
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

        {/* Related */}
        {related.length > 0 && (
          <section className={s.section}>
            <div className={s.sectionHead}>
              <div>
                <div className={s.sectionLabel}>More from {product.category}</div>
                <h2 className={s.sectionTitle}>You might also like</h2>
              </div>
              <Link href="/preview/thread/products" className={`${s.btn} ${s.btnOutline}`}>View All</Link>
            </div>
            <div className={`${s.productGrid} ${s.productGrid4}`}>
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
      <NewsletterSection />
    </PageShell>
  )
}
