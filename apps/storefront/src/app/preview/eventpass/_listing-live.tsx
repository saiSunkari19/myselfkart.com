"use client"

import Link from "next/link"

import { PageShell } from "./_components"
import { T } from "./_tokens"
import type { CategoryView } from "../../../lib/views"

/** Eventpass /categories — real Medusa categories (or tag-derived), with empty state. */
export function EventpassCategoriesLivePage({ categories }: { categories: CategoryView[] }) {
  return (
    <PageShell>
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
          Browse by type
        </div>
        <h1 style={{ color: T.text, fontSize: 32, fontWeight: 800, margin: 0 }}>Explore Categories</h1>
      </div>
      {categories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.textLight }}>
          <p style={{ marginBottom: 20 }}>No categories yet.</p>
          <Link href="/shop" style={{ color: T.text, fontWeight: 700 }}>Browse all events →</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {categories.map(cat => (
            <Link key={cat.id} href={cat.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: T.bgCard, border: `1px solid ${T.border}`,
                borderRadius: T.radiusLg, padding: "24px 16px", textAlign: "center",
                boxShadow: T.shadow,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10, color: T.accent }}>🎟️</div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cat.name}</div>
                <div style={{ color: T.textLight, fontSize: 12 }}>{cat.count} event{cat.count !== 1 ? "s" : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  )
}
