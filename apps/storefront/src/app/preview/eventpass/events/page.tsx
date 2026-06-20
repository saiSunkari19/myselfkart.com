"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { PageShell, EventCard, SectionHeader, T } from "../_components"
import { EVENTS, CATEGORIES } from "../_data"

type SortKey = "relevance" | "price_asc" | "price_desc" | "date_asc"

function EventsContent() {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("cat") ?? "All")
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") ?? "All")
  const [priceRange, setPriceRange] = useState("All")
  const [sort, setSort] = useState<SortKey>("relevance")
  const [view, setView] = useState<"grid" | "list">("grid")

  // Sync URL params on mount
  useEffect(() => {
    const q = searchParams.get("q")
    const cat = searchParams.get("cat")
    const city = searchParams.get("city")
    if (q) setSearch(q)
    if (cat) setSelectedCategory(cat)
    if (city) setSelectedCity(city)
  }, [searchParams])

  const filtered = useMemo(() => {
    let results = EVENTS.filter(e => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        e.title.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      const matchCat = selectedCategory === "All" || e.category === selectedCategory
      const matchCity = selectedCity === "All" || e.city === selectedCity
      const matchPrice =
        priceRange === "All" ? true :
        priceRange === "free" ? e.price === 0 :
        priceRange === "under1000" ? e.price < 1000 :
        priceRange === "under5000" ? e.price < 5000 : true
      return matchSearch && matchCat && matchCity && matchPrice
    })

    switch (sort) {
      case "price_asc":  results = [...results].sort((a, b) => a.price - b.price); break
      case "price_desc": results = [...results].sort((a, b) => b.price - a.price); break
      case "date_asc":   results = [...results].sort((a, b) => a.date.localeCompare(b.date)); break
    }
    return results
  }, [search, selectedCategory, selectedCity, priceRange, sort])

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory("All")
    setSelectedCity("All")
    setPriceRange("All")
    setSort("relevance")
  }

  const hasFilters = search || selectedCategory !== "All" || selectedCity !== "All" || priceRange !== "All"

  const selectStyle = {
    border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 14px",
    fontSize: 14, color: T.text, background: "#fff", cursor: "pointer",
    outline: "none", appearance: "none" as const,
  }

  return (
    <PageShell>
      <style>{`
        @media (max-width: 640px) {
          .ep-events-filters { flex-direction: column !important; }
          .ep-events-filters > * { width: 100% !important; min-width: unset !important; }
        }
      `}</style>

      <SectionHeader label="All events" title="Discover Events" subtitle="Search, filter, and find the perfect experience" />

      {/* Search + Filter bar — marginTop: 0 since SectionHeader already provides 14px */}
      <div style={{
        background: T.bgSubtle, borderRadius: 20, padding: 20,
        border: `1px solid ${T.border}`, marginBottom: 32,
      }}>
        <div className="ep-events-filters" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{
            flex: "1 1 200px",
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "0 16px",
          }}>
            <span>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, artists, venues…"
              style={{ border: "none", outline: "none", padding: "12px 0", fontSize: 14, width: "100%", background: "transparent", color: T.text }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.textLight, fontSize: 16, padding: 0 }}>✕</button>
            )}
          </div>

          {/* Category */}
          <div style={{ position: "relative" }}>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={selectStyle}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* City */}
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={selectStyle}>
            <option value="All">All Cities</option>
            {["Mumbai", "Delhi", "Bangalore", "Pune", "Rishikesh"].map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Price */}
          <select value={priceRange} onChange={e => setPriceRange(e.target.value)} style={selectStyle}>
            <option value="All">Any Price</option>
            <option value="free">Free</option>
            <option value="under1000">Under ₹1,000</option>
            <option value="under5000">Under ₹5,000</option>
          </select>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={selectStyle}>
            <option value="relevance">Sort: Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="date_asc">Date: Earliest First</option>
          </select>

          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
            {(["grid", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "10px 16px", border: "none", cursor: "pointer", fontSize: 16,
                background: view === v ? T.accent : "#fff",
                color: view === v ? "#fff" : T.textMuted,
              }}>
                {v === "grid" ? "⊞" : "≡"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
          {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
        </h2>
        {hasFilters && (
          <button onClick={clearFilters} style={{
            background: "none", border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "6px 14px", fontSize: 13,
            color: T.textMuted, cursor: "pointer",
          }}>
            Clear filters ✕
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
          <p style={{ color: T.textMuted, fontSize: 16 }}>No events match your filters.</p>
          <button onClick={clearFilters} style={{
            marginTop: 12, background: T.accent, color: "#fff",
            border: "none", borderRadius: 10, padding: "10px 24px",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Clear filters</button>
        </div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map(event => (
            <a key={event.id} href={`/preview/eventpass/events/${event.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", gap: 0, background: T.bgCard,
                border: `1px solid ${T.border}`, borderRadius: T.radiusLg,
                overflow: "hidden", boxShadow: T.shadow, cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowMd}
                onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}
              >
                <img src={event.image} alt={event.title} style={{ width: 180, minHeight: 130, objectFit: "cover", flexShrink: 0 }} />
                <div style={{ padding: "18px 20px", flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <span style={{
                      background: event.tagColor, color: "#fff",
                      fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "2px 8px", marginBottom: 8, display: "inline-block",
                    }}>{event.tag}</span>
                    <h3 style={{ color: T.text, margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{event.title}</h3>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ color: T.textMuted, fontSize: 13 }}>📅 {event.date}</span>
                      <span style={{ color: T.textMuted, fontSize: 13 }}>📍 {event.venue}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: T.textLight, fontSize: 11, marginBottom: 4 }}>FROM</div>
                    <div style={{ color: T.text, fontWeight: 800, fontSize: 20, marginBottom: 10 }}>₹{event.price.toLocaleString()}</div>
                    <button style={{
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      color: "#fff", border: "none", borderRadius: 10,
                      padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>Book Now →</button>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </PageShell>
  )
}

export default function EventsListingPage() {
  return (
    <Suspense fallback={<PageShell><div style={{ textAlign: "center", padding: "80px 0", color: T.textMuted }}>Loading…</div></PageShell>}>
      <EventsContent />
    </Suspense>
  )
}
