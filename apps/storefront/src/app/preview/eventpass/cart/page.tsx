"use client"

import Link from "next/link"
import { useState } from "react"
import { PageShell, T } from "../_components"
import { useCart } from "../_cart"
import { useTemplateConfig } from "../../../../lib/template-config-context"

export default function CartPage() {
  const { basePath } = useTemplateConfig()
  const { items, updateQty, subtotal } = useCart()
  const [promo, setPromo] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)

  const serviceFee = Math.round(subtotal * 0.05)
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0
  const total = subtotal + serviceFee - discount

  // Group items by event
  const events = Array.from(new Set(items.map(i => i.eventId))).map(id => ({
    ...items.find(i => i.eventId === id)!,
    tickets: items.filter(i => i.eventId === id),
  }))

  return (
    <PageShell>
      <style>{`
        @media (max-width: 768px) {
          .ep-cart-grid { grid-template-columns: 1fr !important; }
          .ep-cart-summary { position: static !important; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ color: T.text, fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
          Your Cart
        </h1>
        <p style={{ color: T.textMuted, marginBottom: 32 }}>
          Review your tickets before checkout
        </p>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🎟️</div>
            <h2 style={{ color: T.text, marginBottom: 12 }}>Your cart is empty</h2>
            <p style={{ color: T.textMuted, marginBottom: 28 }}>Find an event and add tickets to get started.</p>
            <Link href={`${basePath}/events`}>
              <button style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff", border: "none", borderRadius: 12,
                padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>Browse Events</button>
            </Link>
          </div>
        ) : (
          <div className="ep-cart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
            {/* Left — tickets grouped by event */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {events.map(ev => (
                <div key={ev.eventId}>
                  {/* Event header */}
                  <div style={{
                    display: "flex", gap: 16, background: T.bgSubtle,
                    border: `1px solid ${T.border}`, borderRadius: T.radiusLg,
                    padding: 20, marginBottom: 12,
                  }}>
                    <img
                      src={ev.eventImage}
                      alt={ev.eventTitle}
                      style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: T.text, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{ev.eventTitle}</div>
                      <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 2 }}>📅 {ev.eventDate}</div>
                      <div style={{ color: T.textMuted, fontSize: 13 }}>📍 {ev.eventVenue}</div>
                    </div>
                  </div>

                  {/* Ticket rows */}
                  {ev.tickets.map(item => (
                    <div key={item.type} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: T.bgCard, border: `1px solid ${T.border}`,
                      borderRadius: T.radiusLg, padding: "16px 20px", marginBottom: 10,
                      boxShadow: T.shadow, flexWrap: "wrap", gap: 12,
                    }}>
                      <div>
                        <div style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{item.type}</div>
                        <div style={{ color: T.textMuted, fontSize: 13 }}>₹{item.price.toLocaleString()} each</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button onClick={() => updateQty(item.eventId, item.type, -1)} style={{
                            width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${T.border}`,
                            background: "#fff", cursor: "pointer", fontSize: 18,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 24, textAlign: "center", fontSize: 15 }}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQty(item.eventId, item.type, 1)} style={{
                            width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${T.accent}`,
                            background: T.accent, cursor: "pointer", fontSize: 18, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>+</button>
                        </div>
                        <div style={{ minWidth: 80, textAlign: "right" }}>
                          <div style={{ color: T.text, fontWeight: 800, fontSize: 16 }}>
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Right — order summary */}
            <div className="ep-cart-summary" style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.radiusLg, padding: 28, boxShadow: T.shadowMd, position: "sticky", top: 80,
            }}>
              <h3 style={{ color: T.text, fontWeight: 800, fontSize: 18, marginBottom: 20, marginTop: 0 }}>
                Order Summary
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {items.map(item => (
                  <div key={`${item.eventId}-${item.type}`} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: T.textMuted, fontSize: 13 }}>{item.type} × {item.quantity}</span>
                    <span style={{ color: T.text, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: T.textMuted, fontSize: 13 }}>Service fee (5%)</span>
                  <span style={{ color: T.text, fontSize: 13 }}>₹{serviceFee.toLocaleString()}</span>
                </div>
                {promoApplied && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.success, fontSize: 13, fontWeight: 600 }}>Promo (10% off)</span>
                    <span style={{ color: T.success, fontSize: 13, fontWeight: 600 }}>−₹{discount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Promo code */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={promo}
                    onChange={e => setPromo(e.target.value)}
                    placeholder="Promo code"
                    style={{
                      flex: 1, border: `1px solid ${T.border}`, borderRadius: 10,
                      padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit",
                    }}
                  />
                  <button
                    onClick={() => promo.length > 0 && setPromoApplied(true)}
                    style={{
                      background: T.bgSubtle, border: `1px solid ${T.border}`,
                      borderRadius: 10, padding: "10px 16px", fontSize: 13,
                      fontWeight: 600, cursor: "pointer", color: T.text, flexShrink: 0,
                    }}
                  >Apply</button>
                </div>
                {promoApplied && (
                  <div style={{ color: T.success, fontSize: 12, marginTop: 6, fontWeight: 600 }}>✓ Promo applied!</div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>Total</span>
                  <span style={{ color: T.text, fontWeight: 900, fontSize: 22 }}>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <Link href={`${basePath}/checkout`} style={{ textDecoration: "none" }}>
                <button style={{
                  width: "100%", padding: "15px",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}>Proceed to Checkout →</button>
              </Link>

              <p style={{ color: T.textLight, fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
                🔒 Secure checkout · No account needed
              </p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
