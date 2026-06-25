"use client"

import Link from "next/link"
import { NavBar, Footer, T } from "../_components"
import { useTemplateConfig } from "../../../../lib/template-config-context"

const DEFAULT_ABOUT_STATS = [
  { value: "500+", label: "Events listed", sub: "across 20+ cities" },
  { value: "50,000+", label: "Tickets booked", sub: "with zero signups" },
  { value: "< 90s", label: "Average checkout time", sub: "from landing to ticket" },
  { value: "4.9 / 5", label: "Buyer satisfaction", sub: "across 3,200+ reviews" },
]

export default function AboutPage() {
  const { basePath, config } = useTemplateConfig()
  const stats = config?.sections?.about_stats?.items ?? DEFAULT_ABOUT_STATS
  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 1024px) {
          .ep-about-story { grid-template-columns: 1fr !important; gap: 32px !important; }
          .ep-about-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 32px 24px !important; }
          .ep-about-stats > div { border-left: none !important; padding: 0 !important; }
          .ep-about-contact { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 640px) {
          .ep-about-hero-overlay { left: 20px !important; right: 20px !important; bottom: 32px !important; }
          .ep-about-section { padding-left: 20px !important; padding-right: 20px !important; }
          .ep-about-contact { grid-template-columns: 1fr !important; }
          .ep-about-cta { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; padding: 40px 20px !important; }
        }
      `}</style>
      <NavBar />

      {/* Hero — full bleed image with text */}
      <div style={{ paddingTop: 64, position: "relative", height: 560, overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=80"
          alt="Crowd at a live event"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 100%)",
        }} />
        <div className="ep-about-hero-overlay" style={{ position: "absolute", bottom: 56, left: 60, maxWidth: 560 }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
            About EventPass
          </p>
          <h1 style={{
            color: "#fff", fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 900, lineHeight: 1.1, margin: 0, letterSpacing: "-1.5px",
          }}>
            We exist so you<br />can just show up.
          </h1>
        </div>
      </div>

      {/* Story — editorial 2 column */}
      <div className="ep-about-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 60px" }}>
        <div className="ep-about-story" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <h2 style={{
              fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 900,
              color: T.text, lineHeight: 1.15, margin: "0 0 32px", letterSpacing: "-1px",
            }}>
              Booking tickets in India<br />was broken. We fixed it.
            </h2>
            <div style={{
              width: 48, height: 3, background: T.accent,
              borderRadius: 2, marginBottom: 32,
            }} />
          </div>
          <div>
            {config?.about_text ? (
              <p style={{ color: T.textMuted, fontSize: 17, lineHeight: 1.9, margin: 0, whiteSpace: "pre-line" }}>
                {config.about_text}
              </p>
            ) : (
              <>
                <p style={{ color: T.textMuted, fontSize: 17, lineHeight: 1.9, margin: "0 0 24px" }}>
                  Every time we tried to book tickets for a concert, a stand-up show, or a conference — we hit the same wall. Create an account. Verify your email. Add your address. Pick a seat from a tiny blurry map. Re-enter your card details. Wait for an OTP.
                </p>
                <p style={{ color: T.textMuted, fontSize: 17, lineHeight: 1.9, margin: "0 0 24px" }}>
                  Half the time we'd give up and just not go. That's a problem — not because we lost tickets, but because the event lost us.
                </p>
                <p style={{ color: T.text, fontSize: 17, lineHeight: 1.9, margin: 0, fontWeight: 500 }}>
                  EventPass is the platform we wanted to exist. Name, email, phone — that's it. Your QR ticket lands in your inbox in seconds.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats — full bleed accent */}
      <div style={{ background: T.bgSubtle, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div className="ep-about-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 60px" }}>
          <div className="ep-about-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {[
              { value: "500+", label: "Events listed", sub: "across 20+ cities" },
              { value: "50,000+", label: "Tickets booked", sub: "with zero signups" },
              { value: "< 90s", label: "Average checkout time", sub: "from landing to ticket" },
              { value: "4.9 / 5", label: "Buyer satisfaction", sub: "across 3,200+ reviews" },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: "0 40px",
                borderLeft: i > 0 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ color: T.text, fontWeight: 900, fontSize: 36, letterSpacing: "-1px", marginBottom: 6 }}>{stat.value}</div>
                <div style={{ color: T.text, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ color: T.textLight, fontSize: 13 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image break */}
      <div style={{ position: "relative", height: 400, overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80"
          alt="Conference crowd"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <blockquote style={{
            color: "#fff", fontSize: "clamp(22px, 3vw, 36px)",
            fontWeight: 800, textAlign: "center", maxWidth: 700,
            margin: 0, lineHeight: 1.3, letterSpacing: "-0.5px",
          }}>
            "The best events are the ones you actually make it to."
          </blockquote>
        </div>
      </div>

      {/* Contact — merged in from the old standalone /contact page */}
      <div className="ep-about-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 60px" }}>
        <p style={{ color: T.textLight, fontSize: 12, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
          Get in touch
        </p>
        <h2 style={{ color: T.text, fontSize: 30, fontWeight: 900, margin: "0 0 32px", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          Have a question? We typically respond within 2 hours.
        </h2>
        <div className="ep-about-contact" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            { icon: "📧", title: "Email Support", desc: config?.contact_email || "support@eventpass.in", sub: "We reply within 2 hours" },
            { icon: "💬", title: "Live Chat", desc: "Available Mon–Sat, 10am–7pm", sub: "Average response: 5 minutes" },
            { icon: "📞", title: "Phone", desc: config?.contact_phone || "+91 98765 00000", sub: "Mon–Fri, 10am–6pm" },
            { icon: "🏢", title: "Office", desc: config?.business_address || "Mumbai, Maharashtra, India", sub: "Not open to walk-ins" },
          ].map(item => (
            <div key={item.title} style={{
              display: "flex", flexDirection: "column", gap: 12, background: T.bgSubtle,
              border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: "20px 24px",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: T.accentLight,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>{item.icon}</div>
              <div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                <div style={{ color: T.textMuted, fontSize: 14 }}>{item.desc}</div>
                <div style={{ color: T.textLight, fontSize: 12, marginTop: 2 }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA — minimal */}
      <div style={{ borderTop: `1px solid ${T.border}`, background: T.bgSubtle }}>
        <div className="ep-about-cta" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ color: T.text, fontWeight: 800, fontSize: 24, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              Find something worth going to.
            </h3>
            <p style={{ color: T.textMuted, fontSize: 15, margin: 0 }}>500+ events across India. No account needed.</p>
          </div>
          <Link href={`${basePath}/events`} style={{ textDecoration: "none" }}>
            <button style={{
              background: T.text, color: "#fff",
              border: "none", borderRadius: 12,
              padding: "14px 32px", fontSize: 15, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>Browse Events →</button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
