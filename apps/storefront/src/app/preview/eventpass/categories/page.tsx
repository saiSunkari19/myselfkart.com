"use client"

import Link from "next/link"
import { PageShell, SectionHeader, EventCard, T } from "../_components"
import { CATEGORIES, EVENTS } from "../_data"

export default function CategoriesPage() {
  return (
    <PageShell>
      <SectionHeader label="Browse" title="All Categories" subtitle="Find events by what you love" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, marginBottom: 72 }}>
        {CATEGORIES.map(cat => (
          <Link key={cat.name} href="/preview/eventpass/events" style={{ textDecoration: "none" }}>
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.radiusLg, padding: "32px 24px", textAlign: "center",
              cursor: "pointer", boxShadow: T.shadow,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)"
                e.currentTarget.style.boxShadow = T.shadowMd
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = T.shadow
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 14 }}>{cat.icon}</div>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{cat.name}</div>
              <div style={{ color: T.textLight, fontSize: 13 }}>{cat.count} events</div>
            </div>
          </Link>
        ))}
      </div>

      <SectionHeader label="Popular" title="Trending Across Categories" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {EVENTS.slice(0, 3).map(event => <EventCard key={event.id} event={event} />)}
      </div>
    </PageShell>
  )
}
