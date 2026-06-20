"use client"

import Link from "next/link"
import { useState } from "react"
import { NavBar, Footer, EventCard, SectionHeader, T } from "./_components"
import { EVENTS, CATEGORIES, CITIES } from "./_data"

const HeroSection = () => {
  const [search, setSearch] = useState("")
  const [city, setCity] = useState("All Cities")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set("q", search.trim())
    if (city !== "All Cities") params.set("city", city)
    window.location.href = `/preview/eventpass/events?${params.toString()}`
  }

  return (
    // Fix 1: paddingTop 64 accounts for fixed navbar; no top gap
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", paddingTop: 64 }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80)",
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      {/* Fix 2: right side barely tinted so image shows through clearly */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to right, rgba(255,255,255,0.96) 38%, rgba(255,255,255,0.15) 70%, rgba(255,255,255,0) 100%)",
      }} />

      <div style={{ position: "relative", zIndex: 1, padding: "60px 40px", maxWidth: 680 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: T.accentLight, borderRadius: 100, padding: "6px 16px", marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, display: "inline-block" }} />
          <span style={{ color: T.accent, fontSize: 13, fontWeight: 600 }}>
            500+ events happening across India
          </span>
        </div>

        <h1 style={{
          color: T.text, fontSize: "clamp(36px, 5vw, 64px)",
          fontWeight: 900, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-2px",
        }}>
          Discover<br />
          experiences<br />
          <span style={{ color: T.accent }}>worth living for</span>
        </h1>
        <p style={{ color: T.textMuted, fontSize: 18, margin: "0 0 40px", lineHeight: 1.6, maxWidth: 420 }}>
          Premium events, zero friction. Browse, pick, book — no account needed.
        </p>

        {/* Fix 3: Search navigates to events page with filters pre-applied */}
        <div style={{
          display: "flex", background: "#fff",
          borderRadius: 16, border: `1.5px solid ${T.border}`,
          boxShadow: T.shadowMd, overflow: "hidden", maxWidth: 600,
        }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 16px" }}>
            <span style={{ marginRight: 10, fontSize: 16 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search events, artists, venues…"
              style={{
                border: "none", outline: "none", width: "100%",
                fontSize: 14, color: T.text, background: "transparent", padding: "16px 0",
              }}
            />
          </div>
          <div style={{
            borderLeft: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", padding: "0 16px", gap: 6, minWidth: 130,
          }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: 13, color: T.textMuted, background: "transparent", cursor: "pointer" }}
            >
              <option>All Cities</option>
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>Bangalore</option>
              <option>Pune</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff", border: "none",
              padding: "0 28px", fontSize: 14, fontWeight: 700,
              cursor: "pointer", margin: 8, borderRadius: 10, whiteSpace: "nowrap",
            }}>
            Search
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { label: "🎵 Music", q: "Music" },
            { label: "🎤 Conferences", q: "Conference" },
            { label: "😂 Comedy", q: "Comedy" },
            { label: "🎨 Art & Culture", q: "Art" },
          ].map(tag => (
            <button
              key={tag.label}
              onClick={() => { window.location.href = `/preview/eventpass/events?q=${tag.q}` }}
              style={{
                background: "#fff", border: `1px solid ${T.border}`,
                color: T.textMuted, borderRadius: 100,
                padding: "6px 16px", fontSize: 13, cursor: "pointer",
                boxShadow: T.shadow,
              }}>{tag.label}</button>
          ))}
        </div>
      </div>
    </section>
  )
}

const StatsBar = () => (
  <div style={{ background: T.accent, padding: "20px 40px" }}>
    <div style={{
      maxWidth: 1200, margin: "0 auto",
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    }}>
      {[
        { value: "500+", label: "Events Listed" },
        { value: "50K+", label: "Tickets Booked" },
        { value: "20+", label: "Cities Covered" },
        { value: "4.9★", label: "Average Rating" },
      ].map(s => (
        <div key={s.label} style={{ textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 24 }}>{s.value}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{s.label}</div>
        </div>
      ))}
    </div>
  </div>
)

const ViewAllLink = ({ href }: { href: string }) => (
  <Link href={href} style={{ color: T.accent, textDecoration: "none", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
    View all →
  </Link>
)

const TrendingSection = () => (
  <section style={{ padding: "80px 40px", background: T.bg }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SectionHeader
        label="Hot right now"
        title="Trending Events"
        subtitle="Events everyone's talking about this week"
        action={<ViewAllLink href="/preview/eventpass/events" />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {EVENTS.slice(0, 3).map(event => <EventCard key={event.id} event={event} />)}
      </div>
    </div>
  </section>
)

const FeaturedSection = () => (
  <section style={{ padding: "0 40px 80px", background: T.bg }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SectionHeader
        label="Editor's picks"
        title="Featured Events"
        action={<ViewAllLink href="/preview/eventpass/events" />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {EVENTS.slice(3).map(event => <EventCard key={event.id} event={event} />)}
      </div>
    </div>
  </section>
)

const CategoriesSection = () => (
  <section style={{ padding: "80px 40px", background: T.bgSubtle }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SectionHeader label="Browse by type" title="Explore Categories" subtitle="Find exactly what you're in the mood for" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        {CATEGORIES.map(cat => (
          <Link key={cat.name} href={`/preview/eventpass/events?cat=${encodeURIComponent(cat.name)}`} style={{ textDecoration: "none" }}>
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.radiusLg, padding: "24px 16px", textAlign: "center",
              cursor: "pointer", boxShadow: T.shadow,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = T.shadowMd
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = T.shadow
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{cat.icon}</div>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cat.name}</div>
              <div style={{ color: T.textLight, fontSize: 12 }}>{cat.count} events</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
)

const CitiesSection = () => (
  <section style={{ padding: "80px 40px", background: T.bg }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SectionHeader label="Explore locally" title="Browse by City" subtitle="Events happening near you right now" />
      <div className="ep-cities-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        {CITIES.map(city => (
          <Link key={city.name} href={`/preview/eventpass/events?city=${encodeURIComponent(city.name)}`} style={{ textDecoration: "none" }}>
            <div style={{
              position: "relative", borderRadius: T.radiusLg, overflow: "hidden",
              cursor: "pointer", aspectRatio: "3/4",
              boxShadow: T.shadow, transition: "transform 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <img src={city.image} alt={city.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: 20, left: 20 }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, marginBottom: 2 }}>{city.name}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{city.count} events</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
)

const HowItWorksSection = () => (
  <section style={{ padding: "80px 40px", background: T.bgSubtle }}>
    <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
      <SectionHeader label="Simple process" title="How it works" />
      <div className="ep-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
        {[
          { step: "01", title: "Discover", desc: "Browse hundreds of curated events across categories, cities, and dates.", icon: "🔍" },
          { step: "02", title: "Choose tickets", desc: "Pick your ticket type — GA, VIP, or Early Bird. Set quantity. Done.", icon: "🎟️" },
          { step: "03", title: "Book instantly", desc: "Guest checkout. Name, email, phone. QR ticket delivered in seconds.", icon: "⚡" },
        ].map(item => (
          <div key={item.step}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: T.accentLight, margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
            }}>{item.icon}</div>
            <div style={{ color: T.accent, fontSize: 11, fontWeight: 700, letterSpacing: "1px", marginBottom: 10 }}>STEP {item.step}</div>
            <div style={{ color: T.text, fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{item.title}</div>
            <div style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.7 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const TestimonialsSection = () => (
  <section style={{ padding: "80px 40px", background: T.bg }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <SectionHeader label="What people say" title="Loved by event-goers" subtitle="Real feedback from real people" />
      <div className="ep-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {[
          { name: "Priya S.", city: "Mumbai", text: "Booked tickets for Sunburn in under 2 minutes. Seamless experience — no signups, just straight to the event.", rating: 5 },
          { name: "Arjun M.", city: "Bangalore", text: "Found three amazing tech events I didn't even know about. The discovery is genuinely different from other platforms.", rating: 5 },
          { name: "Sneha R.", city: "Delhi", text: "Guest checkout is a game changer. Got my QR tickets on email instantly. Will definitely use again.", rating: 5 },
        ].map((t, i) => (
          <div key={i} style={{
            background: T.bgCard, border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg, padding: 28, boxShadow: T.shadow,
          }}>
            <div style={{ color: T.warning, fontSize: 16, marginBottom: 16 }}>{"★".repeat(t.rating)}</div>
            <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.8, margin: "0 0 20px", fontStyle: "italic" }}>
              "{t.text}"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 16,
              }}>{t.name[0]}</div>
              <div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                <div style={{ color: T.textLight, fontSize: 13 }}>{t.city}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const NewsletterSection = () => {
  const [email, setEmail] = useState("")
  return (
    <section style={{ padding: "80px 40px", background: T.accent }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 20 }}>📬</div>
        <h2 style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.5px" }}>
          Never miss an event
        </h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, margin: "0 0 36px" }}>
          Curated event recommendations delivered to your inbox weekly.
        </p>
        <div style={{
          display: "flex", background: "#fff",
          borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", padding: "16px 20px", color: T.text, fontSize: 14,
            }}
          />
          <button style={{
            background: T.text, color: "#fff", border: "none",
            padding: "12px 24px", margin: 8, borderRadius: 10,
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>Subscribe</button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 14 }}>No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}

export default function EventPassHome() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .ep-cities-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ep-3col { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
        @media (max-width: 480px) {
          .ep-cities-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }
      `}</style>
      <NavBar />
      <HeroSection />
      <StatsBar />
      <TrendingSection />
      <FeaturedSection />
      <CategoriesSection />
      <CitiesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <NewsletterSection />
      <Footer />
    </div>
  )
}
