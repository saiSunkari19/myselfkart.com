import Link from "next/link"
import { NavBar, Footer, T } from "../_components"

export default function AboutPage() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
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
        <div style={{ position: "absolute", bottom: 56, left: 60, maxWidth: 560 }}>
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
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
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
            <p style={{ color: T.textMuted, fontSize: 17, lineHeight: 1.9, margin: "0 0 24px" }}>
              Every time we tried to book tickets for a concert, a stand-up show, or a conference — we hit the same wall. Create an account. Verify your email. Add your address. Pick a seat from a tiny blurry map. Re-enter your card details. Wait for an OTP.
            </p>
            <p style={{ color: T.textMuted, fontSize: 17, lineHeight: 1.9, margin: "0 0 24px" }}>
              Half the time we'd give up and just not go. That's a problem — not because we lost tickets, but because the event lost us.
            </p>
            <p style={{ color: T.text, fontSize: 17, lineHeight: 1.9, margin: 0, fontWeight: 500 }}>
              EventPass is the platform we wanted to exist. Name, email, phone — that's it. Your QR ticket lands in your inbox in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Stats — full bleed accent */}
      <div style={{ background: T.bgSubtle, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
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
                <div style={{ color: T.text, fontWeight: 900, fontSize: 36, letterSpacing: "-1px", marginBottom: 6 }}>{s.value}</div>
                <div style={{ color: T.text, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: T.textLight, fontSize: 13 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values — list with dividers, no cards */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <p style={{ color: T.textLight, fontSize: 12, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
              What we stand for
            </p>
            <h2 style={{ color: T.text, fontSize: 30, fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
              Principles we don't compromise on
            </h2>
          </div>
          <div>
            {[
              {
                number: "01",
                title: "Speed over signup walls",
                body: "Every extra step between intent and booking loses someone who genuinely wanted to go. We've removed every step we could justify removing.",
              },
              {
                number: "02",
                title: "No tracking, no spam",
                body: "We don't store your card. We don't track you across the web. We don't sell your data. You give us your email for a ticket, not a newsletter.",
              },
              {
                number: "03",
                title: "Curated, not ranked by budget",
                body: "Events are chosen by humans who actually attend them — not sorted by whoever paid for placement. The best event for you should be visible regardless of marketing spend.",
              },
              {
                number: "04",
                title: "Fair to the people putting on the show",
                body: "5% fee. Fast payouts. No surprise charges after the contract is signed. Organisers take the risk of running an event — we don't pile on.",
              },
            ].map((v, i) => (
              <div key={v.number} style={{
                display: "grid", gridTemplateColumns: "48px 1fr",
                gap: 24, padding: "32px 0",
                borderTop: `1px solid ${T.border}`,
              }}>
                <div style={{ color: T.textLight, fontSize: 13, fontWeight: 700, paddingTop: 2 }}>{v.number}</div>
                <div>
                  <h3 style={{ color: T.text, fontWeight: 800, fontSize: 18, margin: "0 0 10px" }}>{v.title}</h3>
                  <p style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.8, margin: 0 }}>{v.body}</p>
                </div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}` }} />
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

      {/* Team — editorial list, no circles */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 80 }}>
          <div>
            <p style={{ color: T.textLight, fontSize: 12, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
              The team
            </p>
            <h2 style={{ color: T.text, fontSize: 30, fontWeight: 900, margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
              Small team.<br />Big events.
            </h2>
            <p style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              We're a team of 8 based in Mumbai. Most of us have worked in events, music, or hospitality before. We built this because we lived the problem.
            </p>
          </div>
          <div>
            {[
              { name: "Aarav Mehta", role: "Co-founder & CEO", note: "Previously at BookMyShow. Has been to 200+ events, regrets maybe 3." },
              { name: "Nisha Patel", role: "Co-founder & Head of Design", note: "Designed for Zomato and Swiggy. Believes the checkout flow is the product." },
              { name: "Rohan Sharma", role: "Engineering Lead", note: "Built payments infra at Razorpay. Obsessed with sub-100ms checkout." },
              { name: "Priya Iyer", role: "Head of Partnerships", note: "Spent 6 years booking artists for festivals across South Asia." },
            ].map((p, i) => (
              <div key={p.name} style={{
                display: "grid", gridTemplateColumns: "1fr auto",
                gap: 24, padding: "28px 0",
                borderTop: `1px solid ${T.border}`,
                alignItems: "start",
              }}>
                <div>
                  <div style={{ color: T.text, fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ color: T.accent, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{p.role}</div>
                  <div style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.7 }}>{p.note}</div>
                </div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}` }} />
          </div>
        </div>
      </div>

      {/* Footer CTA — minimal */}
      <div style={{ borderTop: `1px solid ${T.border}`, background: T.bgSubtle }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ color: T.text, fontWeight: 800, fontSize: 24, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              Find something worth going to.
            </h3>
            <p style={{ color: T.textMuted, fontSize: 15, margin: 0 }}>500+ events across India. No account needed.</p>
          </div>
          <Link href="/preview/eventpass/events" style={{ textDecoration: "none" }}>
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
