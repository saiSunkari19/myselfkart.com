"use client"

import { useState, useMemo } from "react"
import { PageShell, ProductCard, Reveal } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const SORT_OPTIONS = ["Relevance", "Popularity", "New Arrivals", "Best Selling", "Customer Rating", "Price: Low to High", "Price: High to Low", "Highest Discount"]

const FILTER_GROUPS = [
  { label: "Category", key: "category", options: ["Smartphones", "Laptops", "Audio", "Smartwatches", "Gaming", "Cameras", "Televisions", "Smart Home"] },
  { label: "Brand", key: "brand", options: ["Apple", "Samsung", "Sony", "Dell", "OnePlus", "Dyson", "Nothing", "Google"] },
  { label: "Ratings", key: "rating", options: ["4★ & above", "3★ & above", "2★ & above"] },
  { label: "Discount", key: "discount", options: ["10% or more", "20% or more", "30% or more", "40% or more"] },
]

type Filters = {
  search: string
  category: string[]
  brand: string[]
  rating: string[]
  discount: string[]
  priceMin: string
  priceMax: string
}

function applyFilters(filters: Filters, sort: string) {
  let list = [...PRODUCTS]

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }
  if (filters.category.length) list = list.filter(p => filters.category.includes(p.category))
  if (filters.brand.length) list = list.filter(p => filters.brand.includes(p.brand))
  if (filters.rating.length) {
    const minRating = Math.min(...filters.rating.map(r => parseFloat(r)))
    list = list.filter(p => p.rating >= minRating)
  }
  if (filters.discount.length) {
    const minDiscount = Math.min(...filters.discount.map(d => parseInt(d)))
    list = list.filter(p => (p.discount ?? 0) >= minDiscount)
  }
  if (filters.priceMin) list = list.filter(p => p.price >= parseInt(filters.priceMin))
  if (filters.priceMax) list = list.filter(p => p.price <= parseInt(filters.priceMax))

  switch (sort) {
    case "Price: Low to High": list.sort((a, b) => a.price - b.price); break
    case "Price: High to Low": list.sort((a, b) => b.price - a.price); break
    case "Customer Rating": list.sort((a, b) => b.rating - a.rating); break
    case "Highest Discount": list.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)); break
    case "Best Selling": list.sort((a, b) => b.reviewCount - a.reviewCount); break
  }

  return list
}

export default function ShopPage() {
  const [sort, setSort] = useState("Relevance")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [openSections, setOpenSections] = useState(["Category", "Brand", "Price Range"])
  const [filters, setFilters] = useState<Filters>({
    search: "", category: [], brand: [], rating: [], discount: [], priceMin: "", priceMax: ""
  })

  const toggleSection = (label: string) =>
    setOpenSections(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])

  const toggleFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }
    })
  }

  const clearAll = () => setFilters({ search: "", category: [], brand: [], rating: [], discount: [], priceMin: "", priceMax: "" })

  const results = useMemo(() => applyFilters(filters, sort), [filters, sort])

  const activeChips = [
    ...filters.category.map(v => ({ key: "category" as keyof Filters, val: v })),
    ...filters.brand.map(v => ({ key: "brand" as keyof Filters, val: v })),
    ...filters.rating.map(v => ({ key: "rating" as keyof Filters, val: v })),
    ...filters.discount.map(v => ({ key: "discount" as keyof Filters, val: v })),
  ]

  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Browse</div>
          <div className={s.pageHeaderTitle}>All Products</div>
          <div className={s.pageHeaderSub}>Discover the best electronics at the best prices</div>
        </div>
      </div>

      <div className={s.container} style={{ paddingTop: 24, paddingBottom: 60 }}>
        {/* Search bar */}
        <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
          <input
            className={s.navSearchInput}
            style={{ flex: 1, maxWidth: 480, borderRadius: "var(--radius)", border: "1.5px solid var(--border2)", padding: "10px 16px", fontSize: 14 }}
            placeholder="Search products, brands, categories..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          {filters.search && (
            <button className={`${s.btn} ${s.btnOutline}`} style={{ padding: "8px 14px" }} onClick={() => setFilters(prev => ({ ...prev, search: "" }))}>✕ Clear</button>
          )}
        </div>

        <div className={s.shopLayout}>
          {/* Sidebar */}
          <aside className={s.filterSidebar}>
            <div className={s.filterHeader}>
              <span className={s.filterHeaderTitle}>Filters</span>
              <span className={s.filterClear} style={{ cursor: "pointer" }} onClick={clearAll}>Clear All</span>
            </div>

            {/* Price Range */}
            <div className={s.filterSection}>
              <div className={s.filterSectionHead} onClick={() => toggleSection("Price Range")}>
                Price Range <span>{openSections.includes("Price Range") ? "−" : "+"}</span>
              </div>
              {openSections.includes("Price Range") && (
                <div className={s.filterSectionBody}>
                  <div className={s.priceRange}>
                    <input
                      className={s.priceInput}
                      placeholder="Min ₹"
                      type="number"
                      value={filters.priceMin}
                      onChange={e => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                    />
                    <span style={{ color: "var(--text3)" }}>—</span>
                    <input
                      className={s.priceInput}
                      placeholder="Max ₹"
                      type="number"
                      value={filters.priceMax}
                      onChange={e => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                    />
                  </div>
                  {[["Under ₹10,000", "10000"], ["₹10k–₹25k", "25000"], ["₹25k–₹50k", "50000"], ["₹50k–₹1L", "100000"], ["Above ₹1L", ""]].map(([label, max]) => (
                    <label key={label} className={s.filterOption} style={{ cursor: "pointer" }}
                      onClick={() => {
                        if (label === "Above ₹1L") setFilters(prev => ({ ...prev, priceMin: "100000", priceMax: "" }))
                        else if (label === "Under ₹10,000") setFilters(prev => ({ ...prev, priceMin: "", priceMax: "10000" }))
                        else setFilters(prev => ({ ...prev, priceMax: max }))
                      }}>
                      <input type="checkbox" readOnly checked={filters.priceMax === max && label !== "Above ₹1L"} />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {FILTER_GROUPS.map(group => (
              <div key={group.label} className={s.filterSection}>
                <div className={s.filterSectionHead} onClick={() => toggleSection(group.label)}>
                  {group.label} <span>{openSections.includes(group.label) ? "−" : "+"}</span>
                </div>
                {openSections.includes(group.label) && (
                  <div className={s.filterSectionBody}>
                    {group.options.map(option => {
                      const checked = (filters[group.key as keyof Filters] as string[]).includes(option)
                      return (
                        <label key={option} className={s.filterOption} style={{ cursor: "pointer" }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleFilter(group.key as keyof Filters, option)} />
                          {option}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </aside>

          {/* Products */}
          <div>
            <div className={s.shopToolbar}>
              <span className={s.shopCount}><strong>{results.length} products</strong> found</span>
              <div className={s.shopSort}>
                <span>Sort by:</span>
                <select className={s.shopSortSelect} value={sort} onChange={e => setSort(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className={s.viewToggle}>
                <button className={`${s.viewToggleBtn} ${view === "grid" ? s.viewToggleBtnActive : ""}`} onClick={() => setView("grid")}>⊞</button>
                <button className={`${s.viewToggleBtn} ${view === "list" ? s.viewToggleBtnActive : ""}`} onClick={() => setView("list")}>☰</button>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {activeChips.map(chip => (
                  <span
                    key={`${chip.key}-${chip.val}`}
                    className={`${s.chip} ${s.chipActive}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleFilter(chip.key, chip.val)}
                  >
                    {chip.val} ✕
                  </span>
                ))}
                <span
                  className={s.chip}
                  style={{ cursor: "pointer", color: "var(--danger)", borderColor: "var(--danger)" }}
                  onClick={clearAll}
                >
                  Clear all
                </span>
              </div>
            )}

            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text2)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No products found</div>
                <div style={{ fontSize: 14 }}>Try adjusting your filters or search terms</div>
                <button className={`${s.btn} ${s.btnPrimary}`} style={{ marginTop: 20 }} onClick={clearAll}>Clear Filters</button>
              </div>
            ) : (
              <div className={view === "grid" ? s.productGrid3 : s.productGridList}>
                {results.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) as 0|1|2}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
