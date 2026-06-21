"use client"

import Link from "next/link"
import React, { useState } from "react"
import type { StoreConfig } from "../../../lib/store-config"
import type { StoreProduct } from "../../../lib/medusa/products"
import { NavBar, Footer, EventCard, SectionHeader, T } from "./_components"
import { EVENTS, CATEGORIES, CITIES, type Event } from "./_data"

/* ---------------------------------------------------------------------------
 * Map a real Medusa StoreProduct → eventpass's EVENT shape.
 *
 * eventpass is built around EVENTS (not products): each real product becomes
 * one "event / ticket". Medusa lacks event-specific fields (date, venue, city,
 * category, time) so we fill those with sensible cycling placeholders — same
 * strategy glow used for unknown fields. The handle is stashed on `id` so the
 * card can deep-link to the real product page `/products/<handle>`.
 * ------------------------------------------------------------------------- */

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
  "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&q=80",
]

const TAGS: { tag: string; tagColor: string }[] = [
  { tag: "Trending", tagColor: "#f59e0b" },
  { tag: "Featured", tagColor: "#6366f1" },
  { tag: "New", tagColor: "#10b981" },
  { tag: "Almost Full", tagColor: "#ef4444" },
]

const PLACEHOLDER_DATES = [
  "Aug 12, 2026",
  "Sep 03, 2026",
  "Oct 19, 2026",
  "Nov 07, 2026",
  "Dec 21, 2026",
]

// Real-product events stash the handle on `id` so the card can link to it.
type LiveEvent = Event & { handle: string | null }

function toEventpassEvent(p: StoreProduct, index: number): LiveEvent {
  const price = p.variants?.find(v => v.calculated_price?.calculated_amount != null)
    ?.calculated_price?.calculated_amount ?? 0
  const img = p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  const city = CITIES[index % CITIES.length].name
  const cat = CATEGORIES[index % CATEGORIES.length]
  const tag = TAGS[index % TAGS.length]
  const date = PLACEHOLDER_DATES[index % PLACEHOLDER_DATES.length]
  const desc = p.description ?? "Book your tickets now — limited availability."

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    category: cat.name,
    date,
    time: "7:00 PM onwards",
    city,
    venue: `${city} Arena, ${city}`,
    price,
    image: img,
    heroImage: img,
    tag: tag.tag,
    tagColor: tag.tagColor,
    description: desc,
    highlights: ["Instant Booking", "Guest Checkout", "QR Tickets"],
    artists: [],
    gallery: [img],
    tickets: [{ type: "General Admission", price, available: 500 }],
    faqs: [],
  }
}

/* ---------------------------------------------------------------------------
 * Live event card — visually mirrors the template's EventCard but links to the
 * real product page `/products/<handle>` so checkout works. Falls back to the
 * template's EventCard (mock-data deep links) when there's no real handle.
 * ------------------------------------------------------------------------- */

function LiveEventCard({ event, accent }: { event: LiveEvent; accent: string }) {
  if (!event.handle) return <EventCard event={event} />
  return (
    <Link href={`/products/${event.handle}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          borderRadius: T.radiusLg, overflow: "hidden",
          background: T.bgCard, border: `1px solid ${T.border}`,
          cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: T.shadow,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-4px)"
          e.currentTarget.style.boxShadow = T.shadowLg
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = T.shadow
        }}
      >
        <div style={{ position: "relative", paddingTop: "60%" }}>
          <img
            src={event.image}
            alt={event.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span style={{
            position: "absolute", top: 12, left: 12,
            background: event.tagColor, color: "#fff",
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 10px",
          }}>{event.tag}</span>
          <span style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(255,255,255,0.95)", color: T.textMuted,
            fontSize: 11, fontWeight: 600, borderRadius: 6, padding: "4px 10px",
          }}>{event.category}</span>
        </div>
        <div style={{ padding: "18px 20px 20px" }}>
          <h3 style={{ color: T.text, margin: "0 0 8px", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
            {event.title}
          </h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <span style={{ color: T.textMuted, fontSize: 13 }}>📅 {event.date}</span>
            <span style={{ color: T.textMuted, fontSize: 13 }}>📍 {event.city}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: T.textLight, fontSize: 11, marginBottom: 2 }}>STARTING FROM</div>
              <div style={{ color: T.text, fontWeight: 800, fontSize: 20 }}>₹{event.price.toLocaleString()}</div>
            </div>
            <button style={{
              background: accent,
              color: "#fff", border: "none", borderRadius: T.radiusSm,
              padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              Book Now →
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ---------------------------------------------------------------------------
 * Hero — config-aware. Keeps the eventpass search-bar hero but renders the
 * seller's hero_heading / hero_subtext / hero_image_url when provided.
 * ------------------------------------------------------------------------- */

function HeroSection({ config, accent }: { config: StoreConfig | null; accent: string }) {
  const [search, setSearch] = useState("")
  const [city, setCity] = useState("All Cities")

  const heroImage = config?.hero_image_url
    || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80"
  const heroHeading = config?.hero_heading
  const heroSub = config?.hero_subtext
  const badgeText = config?.tagline ?? "500+ events happening across India"

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set("q", search.trim())
    if (city !== "All Cities") params.set("city", city)
    window.location.href = `/events?${params.toString()}`
  }

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", paddingTop: 64 }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to right, rgba(255,255,255,0.96) 38%, rgba(255,255,255,0.15) 70%, rgba(255,255,255,0) 100%)",
      }} />

      <div style={{ position: "relative", zIndex: 1, padding: "60px 40px", maxWidth: 680 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: T.accentLight, borderRadius: 100, padding: "6px 16px", marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, display: "inline-block" }} />
          <span style={{ color: accent, fontSize: 13, fontWeight: 600 }}>
            {badgeText}
          </span>
        </div>

        {heroHeading ? (
          <h1 style={{
            color: T.text, fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 900, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-2px",
          }}>
            {heroHeading}
          </h1>
        ) : (
          <h1 style={{
            color: T.text, fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 900, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-2px",
          }}>
            Discover<br />
            experiences<br />
            <span style={{ color: accent }}>worth living for</span>
          </h1>
        )}
        <p style={{ color: T.textMuted, fontSize: 18, margin: "0 0 40px", lineHeight: 1.6, maxWidth: 420 }}>
          {heroSub ?? "Premium events, zero friction. Browse, pick, book — no account needed."}
        </p>

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
              background: accent,
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
              onClick={() => { window.location.href = `/events?q=${tag.q}` }}
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

/* ---- StatsBar (config accent) ---- */
const StatsBar = ({ accent }: { accent: string }) => (
  <div style={{ background: accent, padding: "20px 40px" }}>
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

const ViewAllLink = ({ href, accent }: { href: string; accent: string }) => (
  <Link href={href} style={{ color: accent, textDecoration: "none", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
    View all →
  </Link>
)

/* ---- Event grids (real events, mock fallback) ---- */
const TrendingSection = ({ events, accent }: { events: LiveEvent[]; accent: string }) => (
  <section style={{ padding: "80px 40px", background: T.bg }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SectionHeader
        label="Hot right now"
        title="Trending Events"
        subtitle="Events everyone's talking about this week"
        action={<ViewAllLink href="/events" accent={accent} />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {events.slice(0, 3).map(event => <LiveEventCard key={event.id} event={event} accent={accent} />)}
      </div>
    </div>
  </section>
)

const FeaturedSection = ({ events, accent }: { events: LiveEvent[]; accent: string }) => (
  <section style={{ padding: "0 40px 80px", background: T.bg }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SectionHeader
        label="Editor's picks"
        title="Featured Events"
        action={<ViewAllLink href="/events" accent={accent} />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {(events.length > 3 ? events.slice(3) : events).map(event => (
          <LiveEventCard key={event.id} event={event} accent={accent} />
        ))}
      </div>
    </div>
  </section>
)

/* ---- Decorative sections (mock data kept) ---- */
const CategoriesSection = () => (
  <section style={{ padding: "80px 40px", background: T.bgSubtle }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <SectionHeader label="Browse by type" title="Explore Categories" subtitle="Find exactly what you're in the mood for" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        {CATEGORIES.map(cat => (
          <Link key={cat.name} href={`/events?cat=${encodeURIComponent(cat.name)}`} style={{ textDecoration: "none" }}>
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
          <Link key={city.name} href={`/events?city=${encodeURIComponent(city.name)}`} style={{ textDecoration: "none" }}>
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
          { name: "Priya S.", city: "Mumbai", text: "Booked tickets in under 2 minutes. Seamless experience — no signups, just straight to the event.", rating: 5 },
          { name: "Arjun M.", city: "Bangalore", text: "Found three amazing events I didn't even know about. The discovery is genuinely different.", rating: 5 },
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

const NewsletterSection = ({ accent }: { accent: string }) => {
  const [email, setEmail] = useState("")
  return (
    <section style={{ padding: "80px 40px", background: accent }}>
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

/* ---------------------------------------------------------------------------
 * Main export
 * ------------------------------------------------------------------------- */

export function EventpassLivePage({
  config,
  products: rawProducts = [],
}: {
  config: StoreConfig | null
  products?: StoreProduct[]
}) {
  // Real events with mock fallback. The mock EVENTS satisfy the LiveEvent shape
  // once we attach `handle: null` (so they fall back to the template card).
  const events: LiveEvent[] = rawProducts.length > 0
    ? rawProducts.map(toEventpassEvent)
    : EVENTS.map(e => ({ ...e, handle: null }))

  // eventpass uses inline styles around `T.accent` (#6366f1) for hero CTA,
  // section accents, stats/newsletter backgrounds and "Book Now" buttons.
  // Thread the seller's primary color into those accent spots.
  const accent = config?.primary_color || config?.accent_color || T.accent

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
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
      <HeroSection config={config} accent={accent} />
      <StatsBar accent={accent} />
      <TrendingSection events={events} accent={accent} />
      <FeaturedSection events={events} accent={accent} />
      <CategoriesSection />
      <CitiesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <NewsletterSection accent={accent} />
      <Footer />
    </div>
  )
}
