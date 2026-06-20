"use client"

import { useState } from "react"
import { PageShell, ProductCard } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear"]
const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest"]

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [sort, setSort] = useState("Featured")

  const filtered = PRODUCTS.filter(p =>
    activeCategory === "All" ? true : p.category === activeCategory
  ).sort((a, b) => {
    if (sort === "Price: Low to High") return a.price - b.price
    if (sort === "Price: High to Low") return b.price - a.price
    return 0
  })

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.pageTitle}>
          <div className={s.pageTitleLabel}>The Collection</div>
          <h1 className={s.pageTitleText}>Shop All</h1>
          <p className={s.pageTitleSub}>Natural fabrics, considered cuts, a palette that never shouts.</p>
        </div>

        <div className={s.shopLayout}>
          {/* Filters */}
          <aside className={s.shopFilters}>
            <div className={s.filterGroup}>
              <div className={s.filterTitle}>Category</div>
              <ul className={s.filterList}>
                {CATEGORIES.map(cat => (
                  <li
                    key={cat}
                    className={`${s.filterItem} ${activeCategory === cat ? s.active : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className={s.filterCount}>
                      {cat === "All" ? PRODUCTS.length : PRODUCTS.filter(p => p.category === cat).length}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={s.filterGroup}>
              <div className={s.filterTitle}>Price Range</div>
              <ul className={s.filterList}>
                {["Under ₹1,500", "₹1,500 – ₹3,000", "₹3,000 – ₹6,000", "Above ₹6,000"].map(r => (
                  <li key={r} className={s.filterItem}>{r}</li>
                ))}
              </ul>
            </div>

            <div className={s.filterGroup}>
              <div className={s.filterTitle}>Fabric</div>
              <ul className={s.filterList}>
                {["Linen", "Cotton", "Wool", "Viscose", "Tencel"].map(f => (
                  <li key={f} className={s.filterItem}>{f}</li>
                ))}
              </ul>
            </div>

            <div className={s.filterGroup}>
              <div className={s.filterTitle}>Size</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["XS", "S", "M", "L", "XL", "XXL"].map(sz => (
                  <span key={sz} className={s.sizePill}>{sz}</span>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div>
            <div className={s.shopHeader}>
              <span className={s.shopCount}>{filtered.length} products</span>
              <select
                className={s.sortSelect}
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className={s.productGrid}>
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
