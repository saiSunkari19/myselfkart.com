"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { NavBar, Footer, ProductCard, Reveal, GoldDivider } from "../_components"
import type { Product } from "../_data"
import type { StoreConfig } from "../../../../lib/store-config"
import s from "../_styles.module.css"
import ss from "./_shop.module.css"

const CATEGORIES = ["All", "Serum", "Moisturiser", "Face Oil", "Toner", "Sun Care", "Cleanser", "Eye Care", "Mask"]
const CONCERNS = ["All", "Brightening", "Dryness", "Acne", "Aging", "Sensitivity", "Sun protection"]
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "New Arrivals" },
]

export function ShopClient({ products, config }: { products: Product[]; config?: StoreConfig | null }) {
  const colorVars = {
    ...(config?.primary_color ? { "--charcoal": config.primary_color } : {}),
    ...(config?.accent_color  ? { "--gold":     config.accent_color  } : {}),
  } as React.CSSProperties
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [concern, setConcern] = useState("All")
  const [sort, setSort] = useState("featured")
  const maxPrice = Math.max(...products.map(p => p.price), 3000)
  const [priceMax, setPriceMax] = useState(maxPrice)

  const filtered = useMemo(() => {
    let list = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.keyIngredients.some(i => i.toLowerCase().includes(q))
      )
    }

    if (category !== "All") list = list.filter(p => p.category === category)
    if (concern !== "All") list = list.filter(p => p.concerns.some(c => c.includes(concern)))
    list = list.filter(p => p.price <= priceMax)

    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break
      case "price-desc": list.sort((a, b) => b.price - a.price); break
      case "rating": list.sort((a, b) => b.rating - a.rating); break
      case "newest": list.sort((a, b) => (a.badge === "New" ? -1 : b.badge === "New" ? 1 : 0)); break
    }

    return list
  }, [search, category, concern, sort, priceMax, products])

  const clearFilters = () => {
    setCategory("All"); setConcern("All"); setPriceMax(maxPrice); setSearch("")
  }
  const hasFilters = category !== "All" || concern !== "All" || priceMax < maxPrice || search.trim()

  return (
    <div className={s.page} style={colorVars}>
      <NavBar storeName={config?.store_name} logoUrl={config?.logo_url} announcementText={config?.announcement_enabled ? config?.announcement_text : null} />
      <div className={s.headerSpacer} />

      <div className={ss.pageHeader}>
        <div className={s.container}>
          <div className={ss.breadcrumb}>
            <Link href="/preview/glow" className={ss.breadcrumbLink}>Home</Link>
            <span className={ss.breadcrumbSep}>›</span>
            <span>Shop</span>
          </div>
          <h1 className={ss.pageTitle}>All Products</h1>
          <p className={ss.pageSub}>Clean, science-backed formulas for every skin concern.</p>
          <GoldDivider />
        </div>
      </div>

      <div className={ss.shopOuter}>
        <div className={s.container}>
          <div className={ss.shopLayout}>

            <aside className={ss.sidebar}>
              <div className={ss.sidebarInner}>
                <div className={ss.filterBlock}>
                  <div className={ss.filterBlockTitle}>Search</div>
                  <div className={ss.searchWrap}>
                    <svg className={ss.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                      className={ss.searchInput}
                      placeholder="Products, ingredients…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    {search && <button className={ss.searchClear} onClick={() => setSearch("")}>✕</button>}
                  </div>
                </div>

                <div className={ss.divider} />

                <div className={ss.filterBlock}>
                  <div className={ss.filterBlockTitle}>Category</div>
                  <ul className={ss.filterList}>
                    {CATEGORIES.map(c => (
                      <li key={c}>
                        <button
                          className={`${ss.filterItem} ${category === c ? ss.filterItemActive : ""}`}
                          onClick={() => setCategory(c)}
                        >
                          {c}
                          {category === c && <span className={ss.filterCheck}>✓</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={ss.divider} />

                <div className={ss.filterBlock}>
                  <div className={ss.filterBlockTitle}>Skin Concern</div>
                  <ul className={ss.filterList}>
                    {CONCERNS.map(c => (
                      <li key={c}>
                        <button
                          className={`${ss.filterItem} ${concern === c ? ss.filterItemActive : ""}`}
                          onClick={() => setConcern(c)}
                        >
                          {c}
                          {concern === c && <span className={ss.filterCheck}>✓</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={ss.divider} />

                <div className={ss.filterBlock}>
                  <div className={ss.filterBlockTitle}>
                    Max Price
                    <span className={ss.priceValue}>₹{priceMax.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={maxPrice}
                    step={100}
                    value={priceMax}
                    onChange={e => setPriceMax(Number(e.target.value))}
                    className={ss.priceRange}
                  />
                  <div className={ss.priceLabels}><span>₹500</span><span>₹{maxPrice.toLocaleString("en-IN")}</span></div>
                </div>

                {hasFilters && (
                  <>
                    <div className={ss.divider} />
                    <button className={ss.clearBtn} onClick={clearFilters}>Clear all filters</button>
                  </>
                )}
              </div>
            </aside>

            <div className={ss.gridArea}>
              <div className={ss.gridTopBar}>
                <span className={ss.resultCount}>
                  {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                </span>
                <div className={ss.sortWrap}>
                  <span className={ss.sortLabel}>Sort by</span>
                  <div className={ss.sortTabs}>
                    {SORT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        className={`${ss.sortTab} ${sort === o.value ? ss.sortTabActive : ""}`}
                        onClick={() => setSort(o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasFilters && (
                <div className={ss.activeTags}>
                  {category !== "All" && <span className={ss.tag}>{category} <button onClick={() => setCategory("All")}>✕</button></span>}
                  {concern !== "All" && <span className={ss.tag}>{concern} <button onClick={() => setConcern("All")}>✕</button></span>}
                  {priceMax < maxPrice && <span className={ss.tag}>Under ₹{priceMax.toLocaleString("en-IN")} <button onClick={() => setPriceMax(maxPrice)}>✕</button></span>}
                  {search && <span className={ss.tag}>"{search}" <button onClick={() => setSearch("")}>✕</button></span>}
                </div>
              )}

              {filtered.length > 0 ? (
                <div className={ss.productsGrid}>
                  {filtered.map((p, i) => (
                    <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}>
                      <ProductCard {...p} />
                    </Reveal>
                  ))}
                </div>
              ) : (
                <div className={ss.emptyState}>
                  <div className={ss.emptyIcon}>🔍</div>
                  <div className={ss.emptyTitle}>No products found</div>
                  <div className={ss.emptySub}>Try adjusting your filters or search term.</div>
                  <button className={`${s.btn} ${s.btnDark}`} onClick={clearFilters}>Clear Filters</button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <Footer storeName={config?.store_name} />
    </div>
  )
}
