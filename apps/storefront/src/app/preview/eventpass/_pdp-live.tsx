"use client"

import Link from "next/link"
import { AddToCart } from "../../../components/add-to-cart"
import type { PdpProps } from "../../../lib/themes/types"
import {
  EventpassNav,
  EventpassFooter,
  EventpassEventCard,
  T,
  eventImage,
  eventAccent,
  pageShell,
} from "./_live"

/** Eventpass PDP slot — single event detail + real ticket/variant add-to-cart. */
export function EventpassPdpLivePage({ config, cartCount, product, variants, related }: PdpProps) {
  const accent = eventAccent(config)
  const img = eventImage(product)
  const inr = (a: number | null | undefined) => `₹${(a ?? 0).toLocaleString("en-IN")}`

  return (
    <div style={pageShell()}>
      <EventpassNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 40px 72px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: T.textLight, marginBottom: 24 }}>
          <Link href="/" style={{ color: T.textLight, textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: T.textLight, textDecoration: "none" }}>Events</Link>
          <span>/</span>
          <span style={{ color: T.text }}>{product.title}</span>
        </div>

        <div className="ep-pdp-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "start" }}>
          {/* Event image */}
          <div style={{
            position: "relative", borderRadius: T.radiusLg, overflow: "hidden",
            boxShadow: T.shadowMd, aspectRatio: "4/3", background: T.bgSubtle,
          }}>
            <img src={img} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {product.tags[0] && (
              <span style={{
                position: "absolute", top: 16, left: 16,
                background: "rgba(255,255,255,0.95)", color: T.textMuted,
                fontSize: 12, fontWeight: 600, borderRadius: 8, padding: "5px 12px",
              }}>{product.tags[0]}</span>
            )}
          </div>

          {/* Event info + ticket booking */}
          <div>
            <h1 style={{ color: T.text, fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 900, margin: "0 0 14px", letterSpacing: "-1px", lineHeight: 1.15 }}>
              {product.title}
            </h1>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ color: T.textLight, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}>STARTING FROM</div>
                <div style={{ color: T.text, fontWeight: 800, fontSize: 28 }}>
                  {inr(product.price)}
                  {product.originalPrice && (
                    <span style={{ color: T.textLight, fontSize: 16, fontWeight: 600, textDecoration: "line-through", marginLeft: 10 }}>
                      {inr(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
              {product.isOnSale && (
                <span style={{ background: T.danger, color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 6, padding: "4px 10px" }}>
                  Limited offer
                </span>
              )}
            </div>

            {product.description && (
              <p style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.8, margin: "0 0 24px" }}>
                {product.description}
              </p>
            )}

            {/* Ticket booking card — real variant selector + add-to-cart */}
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.radiusLg, padding: 24, boxShadow: T.shadow,
            }}>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Choose your tickets</div>
              <div className="ep-pdp-addtocart">
                <AddToCart variants={variants} />
              </div>
              <style>{`
                .ep-pdp-addtocart .add-to-cart { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
                .ep-pdp-addtocart .add-to-cart select,
                .ep-pdp-addtocart .add-to-cart input {
                  padding: 10px 12px; border: 1px solid ${T.border};
                  border-radius: ${T.radiusSm}px; font-size: 14px; color: ${T.text};
                  background: #fff; outline: none;
                }
                .ep-pdp-addtocart .add-to-cart select { flex: 1; min-width: 160px; }
                .ep-pdp-addtocart .add-to-cart button {
                  background: ${accent}; color: #fff; border: none;
                  border-radius: ${T.radiusSm}px; padding: 12px 24px;
                  font-size: 14px; font-weight: 700; cursor: pointer; flex: 1; min-width: 140px;
                }
                .ep-pdp-addtocart .state { color: ${T.textMuted}; font-size: 14px; margin: 0; }
              `}</style>
            </div>

            {/* Trust badges — static brand chrome */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              {[
                { icon: "⚡", text: "Instant booking — guest checkout, no account needed" },
                { icon: "📧", text: "E-tickets delivered to your email" },
                { icon: "🔒", text: "Secure payment · 256-bit SSL" },
              ].map(item => (
                <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: T.textMuted }}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related events */}
        {related.length > 0 && (
          <section style={{ marginTop: 72 }}>
            <div style={{ display: "inline-flex", background: T.accentLight, borderRadius: 100, padding: "5px 14px", marginBottom: 12 }}>
              <span style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>You might also like</span>
            </div>
            <h2 style={{ color: T.text, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, margin: "0 0 24px", letterSpacing: "-0.5px" }}>
              More events to explore
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {related.map((p, i) => <EventpassEventCard key={p.id} product={p} index={i} accent={accent} />)}
            </div>
          </section>
        )}
      </main>
      <EventpassFooter config={config} />
      <style>{`
        @media (max-width: 768px) { .ep-pdp-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
