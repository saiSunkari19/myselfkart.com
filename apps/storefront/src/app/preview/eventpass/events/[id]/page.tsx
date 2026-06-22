"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { NavBar, Footer, EventCard, T } from "../../_components"
import { EVENTS } from "../../_data"
import { useTemplateConfig } from "../../../../../lib/template-config-context"

export default function EventDetailPage() {
  const { basePath } = useTemplateConfig()
  const params = useParams()
  const event = EVENTS.find(e => e.id === params.id) ?? EVENTS[0]
  const related = EVENTS.filter(e => e.id !== event.id && e.category === event.category).slice(0, 3)

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(event.tickets.map(t => [t.type, 0]))
  )
  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "faq">("overview")

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0)
  const totalPrice = event.tickets.reduce((sum, t) => sum + (quantities[t.type] ?? 0) * t.price, 0)

  const updateQty = (type: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] ?? 0) + delta),
    }))
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <NavBar />

      {/* Hero */}
      <div style={{ paddingTop: 64, position: "relative" }}>
        <div style={{ position: "relative", height: 480, overflow: "hidden" }}>
          <img src={event.heroImage} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%)" }} />
          <div style={{ position: "absolute", bottom: 40, left: 40 }}>
            <span style={{
              background: event.tagColor, color: "#fff",
              fontSize: 12, fontWeight: 700, borderRadius: 6, padding: "4px 12px", marginBottom: 12, display: "inline-block",
            }}>{event.tag}</span>
            <h1 style={{ color: "#fff", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-1px" }}>
              {event.title}
            </h1>
            <div style={{ display: "flex", gap: 24 }}>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 15 }}>📅 {event.date} · {event.time}</span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 15 }}>📍 {event.venue}</span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 15 }}>🏷️ {event.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}>

          {/* Left column */}
          <div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 32, borderBottom: `1px solid ${T.border}` }}>
              {(["overview", "schedule", "faq"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  border: "none", borderRadius: 0, background: "none", cursor: "pointer",
                  padding: "12px 20px", fontSize: 15, fontWeight: 600, textTransform: "capitalize",
                  color: activeTab === tab ? T.accent : T.textMuted,
                  borderBottom: activeTab === tab ? `2px solid ${T.accent}` : "2px solid transparent",
                  marginBottom: -1,
                }}>{tab}</button>
              ))}
            </div>

            {activeTab === "overview" && (
              <>
                <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, marginBottom: 16 }}>About this event</h2>
                <p style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>{event.description}</p>

                {/* Highlights */}
                <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Event Highlights</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
                  {event.highlights.map(h => (
                    <span key={h} style={{
                      background: T.accentLight, color: T.accent,
                      border: `1px solid rgba(99,102,241,0.2)`,
                      borderRadius: 100, padding: "6px 16px", fontSize: 13, fontWeight: 600,
                    }}>✓ {h}</span>
                  ))}
                </div>

                {/* Artists */}
                {event.artists.length > 0 && (
                  <>
                    <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Lineup</h3>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
                      {event.artists.map(a => (
                        <div key={a} style={{
                          background: T.bgSubtle, border: `1px solid ${T.border}`,
                          borderRadius: 12, padding: "12px 20px", textAlign: "center",
                        }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: "50%",
                            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                            margin: "0 auto 8px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontWeight: 700, fontSize: 16,
                          }}>{a[0]}</div>
                          <div style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{a}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Gallery */}
                {event.gallery.length > 0 && (
                  <>
                    <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Gallery</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 32 }}>
                      {event.gallery.map((img, i) => (
                        <img key={i} src={img} alt="" style={{ width: "100%", borderRadius: 12, objectFit: "cover", aspectRatio: "16/9" }} />
                      ))}
                    </div>
                  </>
                )}

                {/* Map placeholder */}
                <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Venue</h3>
                <div style={{
                  background: T.bgSubtle, border: `1px solid ${T.border}`,
                  borderRadius: T.radiusLg, padding: 24, marginBottom: 32,
                }}>
                  <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>{event.venue}</div>
                  <div style={{ color: T.textMuted, fontSize: 14, marginBottom: 16 }}>{event.city}</div>
                  <div style={{
                    height: 180, background: "#e0e7ff", borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: T.accent, fontWeight: 600, fontSize: 14,
                  }}>📍 Interactive map</div>
                </div>
              </>
            )}

            {activeTab === "schedule" && (
              <div>
                <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Schedule</h2>
                {[
                  { time: "4:00 PM", title: "Gates Open", desc: "Entry begins, food stalls open" },
                  { time: "5:30 PM", title: "Opening Act", desc: "Local artists kick off the evening" },
                  { time: "7:00 PM", title: "Main Show Begins", desc: "First headliner takes the stage" },
                  { time: "9:00 PM", title: "Headline Performance", desc: "Main act" },
                  { time: "11:00 PM", title: "Closing Set", desc: "Final performance and wrap-up" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 20, marginBottom: 24 }}>
                    <div style={{
                      minWidth: 80, color: T.accent, fontWeight: 700,
                      fontSize: 14, paddingTop: 2,
                    }}>{item.time}</div>
                    <div style={{
                      flex: 1, background: T.bgSubtle, borderRadius: 12,
                      padding: "16px 20px", border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ color: T.textMuted, fontSize: 13 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "faq" && (
              <div>
                <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Frequently Asked Questions</h2>
                {event.faqs.map((faq, i) => (
                  <div key={i} style={{
                    background: T.bgSubtle, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: "20px 24px", marginBottom: 12,
                  }}>
                    <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Q: {faq.q}</div>
                    <div style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.7 }}>A: {faq.a}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky ticket card */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.radiusLg, padding: 28, boxShadow: T.shadowLg,
            }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: T.textLight, fontSize: 12, marginBottom: 4 }}>TICKETS FROM</div>
                <div style={{ color: T.text, fontWeight: 900, fontSize: 32 }}>₹{event.price.toLocaleString()}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {event.tickets.map(ticket => (
                  <div key={ticket.type} style={{
                    border: `1.5px solid ${quantities[ticket.type] > 0 ? T.accent : T.border}`,
                    borderRadius: 12, padding: "14px 16px",
                    background: quantities[ticket.type] > 0 ? T.accentLight : T.bg,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{ticket.type}</div>
                        <div style={{ color: T.accent, fontWeight: 800, fontSize: 16 }}>₹{ticket.price.toLocaleString()}</div>
                        {ticket.available === 0 && (
                          <div style={{ color: T.danger, fontSize: 12, fontWeight: 600 }}>Sold out</div>
                        )}
                        {ticket.available > 0 && ticket.available < 50 && (
                          <div style={{ color: T.warning, fontSize: 12, fontWeight: 600 }}>Only {ticket.available} left</div>
                        )}
                      </div>
                      {ticket.available > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button onClick={() => updateQty(ticket.type, -1)} style={{
                            width: 30, height: 30, borderRadius: "50%",
                            border: `1.5px solid ${T.border}`, background: "#fff",
                            cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                          }}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{quantities[ticket.type]}</span>
                          <button onClick={() => updateQty(ticket.type, 1)} style={{
                            width: 30, height: 30, borderRadius: "50%",
                            border: `1.5px solid ${T.accent}`, background: T.accent,
                            cursor: "pointer", fontSize: 18, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>+</button>
                        </div>
                      ) : (
                        <span style={{ color: T.textLight, fontSize: 13 }}>Sold out</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {totalTickets > 0 && (
                <div style={{
                  background: T.bgSubtle, borderRadius: 12, padding: "14px 16px",
                  marginBottom: 16, border: `1px solid ${T.border}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: T.textMuted, fontSize: 13 }}>{totalTickets} ticket{totalTickets > 1 ? "s" : ""}</span>
                    <span style={{ color: T.text, fontSize: 13 }}>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: T.textMuted, fontSize: 13 }}>Service fee</span>
                    <span style={{ color: T.text, fontSize: 13 }}>₹{Math.round(totalPrice * 0.05).toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, color: T.text }}>Total</span>
                    <span style={{ fontWeight: 800, color: T.text, fontSize: 18 }}>
                      ₹{(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <Link href={totalTickets > 0 ? `${basePath}/checkout` : "#"} style={{ textDecoration: "none" }}>
                <button style={{
                  width: "100%", padding: "16px",
                  background: totalTickets > 0 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : T.bgSubtle,
                  color: totalTickets > 0 ? "#fff" : T.textLight,
                  border: "none", borderRadius: 12,
                  fontSize: 16, fontWeight: 700, cursor: totalTickets > 0 ? "pointer" : "default",
                  transition: "opacity 0.2s",
                }}>
                  {totalTickets > 0 ? "Proceed to Checkout →" : "Select tickets above"}
                </button>
              </Link>

              <p style={{ color: T.textLight, fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
                No account needed · Instant confirmation
              </p>
            </div>
          </div>
        </div>

        {/* Related events */}
        {related.length > 0 && (
          <div style={{ marginTop: 80 }}>
            <h2 style={{ color: T.text, fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Similar Events</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {related.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
