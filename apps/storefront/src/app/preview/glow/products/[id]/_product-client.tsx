"use client"

import { useState } from "react"
import { NavBar, Footer, ProductCard } from "../../_components"
import type { Product } from "../../_data"
import type { StoreConfig } from "../../../../../lib/store-config"
import { useTemplateConfig } from "../../../../../lib/template-config-context"
import s from "../../_styles.module.css"

export function ProductDetailClient({
  product,
  related,
  config,
}: {
  product: Product
  related: Product[]
  config?: StoreConfig | null
}) {
  const { basePath } = useTemplateConfig()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const colorVars = {
    ...(config?.primary_color ? { "--charcoal": config.primary_color } : {}),
    ...(config?.accent_color  ? { "--gold":     config.accent_color  } : {}),
  } as React.CSSProperties

  const handleAdd = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className={s.page} style={colorVars}>
      <NavBar storeName={config?.store_name} logoUrl={config?.logo_url} announcementText={config?.announcement_enabled ? config?.announcement_text : null} />
      <div className={s.headerSpacer} />

      <div className={s.container} style={{ padding: "32px 0 80px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--charcoal-light)", marginBottom: 28, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <a href={basePath || "/"} style={{ color: "var(--charcoal-light)", textDecoration: "none" }}>Home</a>
          <span>/</span>
          <a href={`${basePath}/shop`} style={{ color: "var(--charcoal-light)", textDecoration: "none" }}>Shop</a>
          <span>/</span>
          <span style={{ color: "var(--charcoal)" }}>{product.name}</span>
        </div>

        {/* Detail layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "start", marginBottom: 80 }}>
          {/* Images */}
          <div style={{ position: "relative", aspectRatio: "3/4", borderRadius: "var(--radius)", overflow: "hidden", background: "var(--beige)" }}>
            <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {product.badge && (
              <span style={{
                position: "absolute", top: 14, left: 14,
                background: "var(--charcoal)", color: "var(--ivory)",
                fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "5px 10px", borderRadius: 100, fontWeight: 500,
              }}>{product.badge}</span>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--charcoal-light)", marginBottom: 8 }}>
              {product.category}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 600, color: "var(--charcoal)", marginBottom: 8, lineHeight: 1.2 }}>
              {product.name}
            </h1>
            <p style={{ fontSize: 15, color: "var(--charcoal-light)", marginBottom: 16 }}>{product.subtitle}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ color: "var(--gold)" }}>★</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--charcoal)" }}>{product.rating}</span>
              <span style={{ fontSize: 13, color: "var(--charcoal-light)" }}>({product.reviews.toLocaleString()} reviews)</span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: "var(--charcoal)" }}>₹{product.price.toLocaleString("en-IN")}</span>
              {product.originalPrice && (
                <span style={{ fontSize: 16, color: "var(--charcoal-light)", textDecoration: "line-through" }}>
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {product.size && (
              <div style={{ fontSize: 13, color: "var(--charcoal-light)", marginBottom: 24 }}>Size: {product.size}</div>
            )}

            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--charcoal)", marginBottom: 24 }}>{product.description}</p>

            {product.keyIngredients.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--charcoal)", marginBottom: 10 }}>
                  Key Ingredients
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {product.keyIngredients.map(ing => (
                    <span key={ing} style={{
                      fontSize: 12, color: "var(--charcoal)", background: "var(--beige)",
                      padding: "5px 12px", borderRadius: 100,
                    }}>{ing}</span>
                  ))}
                </div>
              </div>
            )}

            {product.skinTypes.length > 0 && (
              <div style={{ fontSize: 13, color: "var(--charcoal-light)", marginBottom: 28 }}>
                Suitable for: {product.skinTypes.join(", ")}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--beige)", borderRadius: 100 }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
                <span style={{ minWidth: 24, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} style={{ padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className={`${s.btn} ${s.btnDark}`}
              style={{ width: "100%", marginBottom: 12, border: "none", cursor: "pointer" }}
            >
              {added ? "Added to Bag ✓" : "Add to Bag"}
            </button>
            <a href={`${basePath}/checkout`} className={`${s.btn} ${s.btnOutlineDark}`} style={{ width: "100%", display: "block", textAlign: "center" }}>
              Buy Now
            </a>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--charcoal-light)", marginBottom: 8 }}>
              You might also like
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "var(--charcoal)", marginBottom: 28 }}>More from {product.category}</h2>
            <div className={s.productsGrid}>
              {related.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}
      </div>

      <Footer storeName={config?.store_name} />
    </div>
  )
}
