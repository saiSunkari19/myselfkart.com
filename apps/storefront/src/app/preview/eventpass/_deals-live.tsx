"use client"

import Link from "next/link"
import type { DealsProps } from "../../../lib/themes/types"
import {
  EventpassNav,
  EventpassFooter,
  EventpassEventCard,
  T,
  eventAccent,
  pageShell,
} from "./_live"

/** Eventpass deals slot — real discounted events; honest empty state when none. */
export function EventpassDealsLivePage({ config, cartCount, deals }: DealsProps) {
  const accent = eventAccent(config)
  const hasDeals = deals.length > 0

  return (
    <div style={pageShell()}>
      <EventpassNav config={config} cartCount={cartCount} hasDeals={hasDeals} categories={[]} />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 40px 72px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", background: T.accentLight, borderRadius: 100, padding: "5px 14px", marginBottom: 12 }}>
            <span style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>Limited time</span>
          </div>
          <h1 style={{ color: T.text, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-1px" }}>
            Special Offers
          </h1>
          <p style={{ color: T.textMuted, fontSize: 16, margin: 0 }}>
            Tickets at honest prices — book before they&apos;re gone.
          </p>
        </div>

        {!hasDeals ? (
          <div style={{
            textAlign: "center", padding: "72px 24px",
            background: T.bgSubtle, border: `1px solid ${T.border}`, borderRadius: T.radiusLg,
          }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🏷️</div>
            <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>No active offers right now</h2>
            <p style={{ color: T.textMuted, fontSize: 15, margin: "0 0 24px" }}>Check back soon — or browse all events.</p>
            <Link href="/shop" style={{
              background: accent, color: "#fff", textDecoration: "none",
              borderRadius: T.radiusSm, padding: "12px 24px", fontSize: 14, fontWeight: 700,
            }}>Browse Events</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {deals.map((p, i) => <EventpassEventCard key={p.id} product={p} index={i} accent={accent} />)}
          </div>
        )}
      </main>
      <EventpassFooter config={config} />
    </div>
  )
}
