"use client"

import Link from "next/link"
import type { ShopProps } from "../../../lib/themes/types"
import {
  EventpassNav,
  EventpassFooter,
  EventpassEventCard,
  T,
  eventAccent,
  pageShell,
} from "./_live"
import { Pagination } from "../../../components/pagination"

/** Eventpass shop slot — "browse events" listing: real products + category filter. */
export function EventpassShopLivePage({ config, cartCount, products, categories, activeCategory, page, totalPages, totalCount }: ShopProps) {
  const accent = eventAccent(config)

  return (
    <div style={pageShell()}>
      <EventpassNav config={config} cartCount={cartCount} hasDeals={false} categories={categories} />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 40px 72px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", background: T.accentLight, borderRadius: 100, padding: "5px 14px", marginBottom: 12 }}>
            <span style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>Discover</span>
          </div>
          <h1 style={{ color: T.text, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-1px" }}>
            All Events
          </h1>
          <p style={{ color: T.textMuted, fontSize: 16, margin: 0 }}>
            {totalCount} event{totalCount !== 1 ? "s" : ""} ready to book — no account needed.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: categories.length > 0 ? "220px 1fr" : "1fr", gap: 32, alignItems: "start" }}>
          {categories.length > 0 && (
            <aside className="ep-shop-filters" style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.radiusLg, padding: 20, boxShadow: T.shadow,
            }}>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Categories</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <li>
                  <Link href="/shop" style={{
                    display: "flex", justifyContent: "space-between", textDecoration: "none",
                    padding: "8px 12px", borderRadius: T.radiusSm, fontSize: 14,
                    fontWeight: activeCategory ? 500 : 700,
                    background: activeCategory ? "transparent" : T.accentLight,
                    color: activeCategory ? T.textMuted : accent,
                  }}>All</Link>
                </li>
                {categories.map(cat => {
                  const active = activeCategory === cat.id
                  return (
                    <li key={cat.id}>
                      <Link href={cat.href} style={{
                        display: "flex", justifyContent: "space-between", textDecoration: "none",
                        padding: "8px 12px", borderRadius: T.radiusSm, fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        background: active ? T.accentLight : "transparent",
                        color: active ? accent : T.textMuted,
                      }}>
                        <span>{cat.name}</span>
                        <span style={{ color: T.textLight }}>{cat.count}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </aside>
          )}

          <div>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", color: T.textMuted }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎫</div>
                <p style={{ fontSize: 16, margin: "0 0 20px" }}>No events are available yet.</p>
                <Link href="/" style={{ color: accent, fontWeight: 600, textDecoration: "none" }}>← Back to Home</Link>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                  {products.map((p, i) => <EventpassEventCard key={p.id} product={p} index={i} accent={accent} />)}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  buildHref={p => `/shop?${activeCategory ? `category=${activeCategory}&` : ""}page=${p}`}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 36, height: 36, padding: "0 10px",
                    border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                    fontSize: 13, fontWeight: 600, color: T.textMuted, textDecoration: "none",
                  }}
                  activeStyle={{ background: accent, color: "#fff", borderColor: accent }}
                />
              </>
            )}
          </div>
        </div>
      </main>
      <EventpassFooter config={config} />
      <style>{`
        @media (max-width: 768px) {
          main > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
