"use client"

import { useState } from "react"
import { PageShell, ProductCard, Reveal } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const CATEGORIES = ["All", "Gold", "Diamond", "Silver", "Bridal", "Gemstone", "Fine Jewellery"]
const METALS = ["All Metals", "22K Gold", "18K Gold", "18K White Gold", "Platinum", "Sterling Silver"]
const OCCASIONS = ["All Occasions", "Bridal", "Everyday", "Anniversary", "Gifting", "Festive"]
const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Best Selling"]

export default function ShopPage() {
  const [category, setCategory] = useState("All")
  const [sort, setSort] = useState("Featured")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")

  const filtered = PRODUCTS
    .filter(p => category === "All" || p.category === category)
    .filter(p => {
      const min = priceMin ? parseInt(priceMin) * 1000 : 0
      const max = priceMax ? parseInt(priceMax) * 1000 : Infinity
      return p.price >= min && p.price <= max
    })
    .sort((a, b) => {
      if (sort === "Price: Low to High") return a.price - b.price
      if (sort === "Price: High to Low") return b.price - a.price
      return 0
    })

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.pageHeader}>
          <div className={s.pageHeaderLabel}>The Collection</div>
          <h1 className={s.pageHeaderTitle}>Shop All Jewellery</h1>
          <p className={s.pageHeaderSub}>
            {PRODUCTS.length} certified pieces — from everyday gold to rare gemstone masterworks.
          </p>
        </div>

        <div className={s.shopLayout}>
          {/* Sidebar */}
          <aside className={s.shopFilters}>
            <div className={s.filterHeading}>Filters</div>

            <div className={s.filterGroup}>
              <div className={s.filterGroupTitle}>Category</div>
              <ul className={s.filterList}>
                {CATEGORIES.map(cat => (
                  <li
                    key={cat}
                    className={`${s.filterItem} ${category === cat ? s.filterItemActive : ""}`}
                    onClick={() => setCategory(cat)}
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
              <div className={s.filterGroupTitle}>Metal Type</div>
              <ul className={s.filterList}>
                {METALS.map(m => (
                  <li key={m} className={s.filterItem}><span>{m}</span></li>
                ))}
              </ul>
            </div>

            <div className={s.filterGroup}>
              <div className={s.filterGroupTitle}>Price Range (₹ '000)</div>
              <div className={s.priceRange}>
                <input
                  className={s.priceInput}
                  placeholder="Min"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  type="number"
                />
                <span style={{ color: "#a09080" }}>–</span>
                <input
                  className={s.priceInput}
                  placeholder="Max"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  type="number"
                />
              </div>
            </div>

            <div className={s.filterGroup}>
              <div className={s.filterGroupTitle}>Occasion</div>
              <ul className={s.filterList}>
                {OCCASIONS.map(o => (
                  <li key={o} className={s.filterItem}><span>{o}</span></li>
                ))}
              </ul>
            </div>

            <div className={s.filterGroup}>
              <div className={s.filterGroupTitle}>Certification</div>
              <ul className={s.filterList}>
                {["BIS Hallmarked", "GIA Certified", "GRS Certified", "AGL Certified"].map(c => (
                  <li key={c} className={s.filterItem}><span>{c}</span></li>
                ))}
              </ul>
            </div>

            <div className={s.filterGroup}>
              <div className={s.filterGroupTitle}>Collection</div>
              <ul className={s.filterList}>
                {["Eternal Gold", "Diamond Dreams", "Royal Bridal", "Gemstone Garden", "Heritage", "Modern Minimal"].map(c => (
                  <li key={c} className={s.filterItem}><span>{c}</span></li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Grid */}
          <div>
            <div className={s.shopHeader}>
              <span className={s.shopCount}>{filtered.length} pieces</span>
              <select
                className={s.sortSelect}
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className={s.emptyState}>
                <div className={s.emptyIcon}>✦</div>
                <div className={s.emptyTitle}>No pieces found</div>
                <p className={s.emptyText}>Try adjusting your filters.</p>
              </div>
            ) : (
              <div className={s.productGrid}>
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} delay={(i % 4) as 0|1|2|3} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
