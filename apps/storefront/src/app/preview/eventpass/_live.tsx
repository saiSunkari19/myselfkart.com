"use client"

import Link from "next/link"
import React from "react"
import type { StoreConfig } from "../../../lib/store-config"
import type { ProductView } from "../../../lib/views"
import type { HomeProps, NavProps, FooterProps } from "../../../lib/themes/types"

/**
 * Eventpass theme — live slots. The Eventpass (events vertical) preview design
 * fed REAL Medusa view models and wired to live routes (`/shop`, `/deals`,
 * `/products/<handle>`, `/cart`). No mock data, no legacy preview links, no
 * `useTemplateConfig` — config arrives as props from the server route.
 *
 * Eventpass has no CSS module: it styles everything inline from the `T` design
 * token object. We redefine `T` here (rather than import the preview
 * `_components.tsx`, which pulls in `useTemplateConfig`/mock `_data`) and export
 * it for the other slot files to share. ProductView fields map to event
 * language: title → event title, thumbnail → event image, price → ticket "from"
 * price, description → blurb, tags[0] → category label.
 */

// ---------------------------------------------------------------------------
// Design tokens + page-shell helper live in a plain module so the server-rendered
// account/login slots can use them too (a "use client" export is unusable from a
// server component). Re-exported here so the client slot files importing from
// `./_live` are unaffected.
// ---------------------------------------------------------------------------
import { T, pageShell } from "./_tokens"
export { T, pageShell }

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
  "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&q=80",
]

export function eventImage(p: ProductView, index = 0): string {
  return p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

function inr(amount: number | null | undefined): string {
  return `₹${(amount ?? 0).toLocaleString("en-IN")}`
}

/** The accent colour: seller brand first, then Eventpass indigo. */
export function eventAccent(config: StoreConfig | null): string {
  return config?.primary_color || config?.accent_color || T.accent
}

// ---------------------------------------------------------------------------
// Live event card → real PDP (`/products/<handle>`)
// ---------------------------------------------------------------------------
export function EventpassEventCard({
  product,
  index = 0,
  accent,
}: {
  product: ProductView
  index?: number
  accent: string
}) {
  return (
    <Link href={product.href} style={{ textDecoration: "none" }}>
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
            src={eventImage(product, index)}
            alt={product.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          {product.isOnSale && (
            <span style={{
              position: "absolute", top: 12, left: 12,
              background: T.danger, color: "#fff",
              fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 10px",
            }}>Offer</span>
          )}
          {product.tags[0] && (
            <span style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(255,255,255,0.95)", color: T.textMuted,
              fontSize: 11, fontWeight: 600, borderRadius: 6, padding: "4px 10px",
            }}>{product.tags[0]}</span>
          )}
        </div>
        <div style={{ padding: "18px 20px 20px" }}>
          <h3 style={{ color: T.text, margin: "0 0 12px", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
            {product.title}
          </h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: T.textLight, fontSize: 11, marginBottom: 2 }}>STARTING FROM</div>
              <div style={{ color: T.text, fontWeight: 800, fontSize: 20 }}>
                {inr(product.price)}
                {product.originalPrice && (
                  <span style={{ color: T.textLight, fontSize: 13, fontWeight: 600, textDecoration: "line-through", marginLeft: 8 }}>
                    {inr(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            <span style={{
              background: accent,
              color: "#fff", border: "none", borderRadius: T.radiusSm,
              padding: "10px 20px", fontSize: 13, fontWeight: 700,
            }}>
              Book Now →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Nav (live routes) — fresh, config from props, no useTemplateConfig
// ---------------------------------------------------------------------------
export function EventpassNav({ config, hasDeals }: NavProps) {
  const storeName = config?.store_name ?? "EventPass"
  return (
    <nav style={{
      position: "sticky", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 40px)", height: 64,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          {config?.logo_url ? (
            <img src={config.logo_url} alt={storeName} style={{ height: 28, objectFit: "contain" }} />
          ) : (
            <>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, color: "#fff",
              }}>{storeName.charAt(0).toUpperCase()}</div>
              <span style={{ color: T.text, fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>
                {storeName}
              </span>
            </>
          )}
        </Link>

        <div className="ep-nav-links" style={{ display: "flex", gap: 28 }}>
          <Link href="/shop" style={{ color: T.textMuted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Discover</Link>
          {hasDeals && (
            <Link href="/deals" style={{ color: T.textMuted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Offers</Link>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/account" style={{
            color: T.textMuted, textDecoration: "none",
            fontSize: 14, fontWeight: 500, padding: "8px 14px",
          }}>
            Account
          </Link>
          <Link href="/cart" style={{
            display: "flex", alignItems: "center", gap: 6,
            color: T.textMuted, textDecoration: "none",
            fontSize: 14, fontWeight: 500, padding: "8px 14px",
            borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
          }}>
            🛒 Cart
          </Link>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .ep-nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Footer (live routes) — satisfies Footer(p: FooterProps)
// ---------------------------------------------------------------------------
export function EventpassFooter({ config }: FooterProps & { hasDeals?: boolean }) {
  const storeName = config?.store_name ?? "EventPass"
  const tagline = config?.tagline ?? "Premium event discovery and ticket booking. No account needed. Just great experiences."
  return (
    <footer style={{
      background: T.bgSubtle, borderTop: `1px solid ${T.border}`,
      padding: "64px 40px 40px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="ep-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48, marginBottom: 56 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800, color: "#fff",
              }}>{storeName.charAt(0).toUpperCase()}</div>
              <span style={{ color: T.text, fontWeight: 800, fontSize: 17 }}>{storeName}</span>
            </div>
            <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.8, maxWidth: 280, margin: 0 }}>
              {tagline}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {config?.instagram_url && <a href={config.instagram_url} style={{ color: T.textMuted, textDecoration: "none", fontSize: 13 }}>Instagram</a>}
              {config?.youtube_url && <a href={config.youtube_url} style={{ color: T.textMuted, textDecoration: "none", fontSize: 13 }}>YouTube</a>}
            </div>
          </div>
          <div>
            <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 20 }}>Discover</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link href="/shop" style={{ color: T.textMuted, textDecoration: "none", fontSize: 14 }}>All Events</Link>
              <Link href="/cart" style={{ color: T.textMuted, textDecoration: "none", fontSize: 14 }}>Your Cart</Link>
            </div>
          </div>
          <div>
            <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 20 }}>Checkout</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link href="/checkout" style={{ color: T.textMuted, textDecoration: "none", fontSize: 14 }}>Book Tickets</Link>
            </div>
          </div>
        </div>
        <div style={{
          borderTop: `1px solid ${T.border}`, paddingTop: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ color: T.textLight, fontSize: 13 }}>
            © 2026 {storeName}. All rights reserved.
          </span>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .ep-footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </footer>
  )
}

// ---------------------------------------------------------------------------
// Section header (token-styled, no mock dependency)
// ---------------------------------------------------------------------------
function SectionHeader({
  label, title, subtitle, action,
}: { label: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: T.accentLight, borderRadius: 100,
        padding: "5px 14px",
      }}>
        <span style={{ color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 10 }}>
        <h2 style={{ color: T.text, fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>{title}</h2>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {subtitle && <p style={{ color: T.textMuted, fontSize: 16, margin: "10px 0 0" }}>{subtitle}</p>}
    </div>
  )
}

function ViewAllLink({ href, accent }: { href: string; accent: string }) {
  return (
    <Link href={href} style={{ color: accent, textDecoration: "none", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
      View all →
    </Link>
  )
}

/** Real-event grid section; renders nothing when there are no events. */
export function EventGridSection({
  label, title, subtitle, products, accent, cta,
}: {
  label: string; title: string; subtitle?: string
  products: ProductView[]; accent: string; cta?: { href: string }
}) {
  if (products.length === 0) return null
  return (
    <section style={{ padding: "72px 40px", background: T.bg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          label={label} title={title} subtitle={subtitle}
          action={cta ? <ViewAllLink href={cta.href} accent={accent} /> : undefined}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {products.map((p, i) => <EventpassEventCard key={p.id} product={p} index={i} accent={accent} />)}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Hero (config-aware brand chrome)
// ---------------------------------------------------------------------------
function HeroSection({ config, accent, hasDeals }: { config: StoreConfig | null; accent: string; hasDeals: boolean }) {
  const heroImage = config?.hero_image_url
    || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80"
  const heroHeading = config?.hero_heading
  const heroSub = config?.hero_subtext
  const badgeText = config?.tagline ?? "Curated events you won't want to miss"
  const heroCta = config?.hero_cta

  return (
    <section style={{ position: "relative", minHeight: "min(80vh, 640px)", display: "flex", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(255,255,255,0.96) 38%, rgba(255,255,255,0.15) 70%, rgba(255,255,255,0) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, padding: "60px 40px", maxWidth: 680 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: T.accentLight, borderRadius: 100, padding: "6px 16px", marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, display: "inline-block" }} />
          <span style={{ color: accent, fontSize: 13, fontWeight: 600 }}>{badgeText}</span>
        </div>
        <h1 style={{ color: T.text, fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-2px" }}>
          {heroHeading ?? (
            <>Discover<br />experiences<br /><span style={{ color: accent }}>worth living for</span></>
          )}
        </h1>
        <p style={{ color: T.textMuted, fontSize: 18, margin: "0 0 36px", lineHeight: 1.6, maxWidth: 440 }}>
          {heroSub ?? "Premium events, zero friction. Browse, pick, book — no account needed."}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={heroCta?.primary_link ?? "/shop"} style={{
            background: accent, color: "#fff", textDecoration: "none",
            borderRadius: T.radiusSm, padding: "14px 28px", fontSize: 15, fontWeight: 700,
          }}>{heroCta?.primary_label ?? "Browse Events"}</Link>
          {hasDeals && (
            <Link href="/deals" style={{
              background: "#fff", color: T.text, textDecoration: "none",
              border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
              padding: "14px 28px", fontSize: 15, fontWeight: 700,
            }}>See Offers</Link>
          )}
        </div>
      </div>
    </section>
  )
}

/** Categories (real categories; hidden when none). */
function CategoriesSection({ categories, accent }: { categories: HomeProps["categories"]; accent: string }) {
  if (categories.length === 0) return null
  return (
    <section style={{ padding: "72px 40px", background: T.bgSubtle }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader label="Browse by type" title="Explore Categories" subtitle="Find exactly what you're in the mood for" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {categories.map(cat => (
            <Link key={cat.id} href={cat.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: T.bgCard, border: `1px solid ${T.border}`,
                borderRadius: T.radiusLg, padding: "24px 16px", textAlign: "center",
                cursor: "pointer", boxShadow: T.shadow,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10, color: accent }}>🎟️</div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cat.name}</div>
                <div style={{ color: T.textLight, fontSize: 12 }}>{cat.count} event{cat.count !== 1 ? "s" : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/** How it works — static brand chrome. */
function HowItWorksSection() {
  return (
    <section style={{ padding: "72px 40px", background: T.bg }}>
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", background: T.accentLight, borderRadius: 100, padding: "5px 14px", marginBottom: 12 }}>
          <span style={{ color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>Simple process</span>
        </div>
        <h2 style={{ color: T.text, fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, margin: "0 0 40px", letterSpacing: "-0.5px" }}>How it works</h2>
        <div className="ep-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
          {[
            { step: "01", title: "Discover", desc: "Browse curated events across categories and dates.", icon: "🔍" },
            { step: "02", title: "Choose tickets", desc: "Pick your ticket type and set quantity. Done.", icon: "🎟️" },
            { step: "03", title: "Book instantly", desc: "Guest checkout. E-tickets delivered in seconds.", icon: "⚡" },
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
}

// ---------------------------------------------------------------------------
// Home slot
// ---------------------------------------------------------------------------
export function EventpassLivePage({ config, products, newArrivals, deals, categories }: HomeProps) {
  const hasDeals = deals.length > 0
  const accent = eventAccent(config)
  const trending = newArrivals.length > 0 ? newArrivals : products
  const featured = products.length > 3 ? products.slice(3) : products

  return (
    <div style={pageShell()}>
      <style>{`
        @media (max-width: 768px) { .ep-3col { grid-template-columns: 1fr !important; gap: 24px !important; } }
      `}</style>
      <EventpassNav config={config} hasDeals={hasDeals} categories={categories} />
      <HeroSection config={config} accent={accent} hasDeals={hasDeals} />
      <EventGridSection
        label="Hot right now" title="Trending Events"
        subtitle="Events everyone's talking about this week"
        products={trending.slice(0, 6)} accent={accent} cta={{ href: "/shop" }}
      />
      <CategoriesSection categories={categories} accent={accent} />
      <EventGridSection
        label="Editor's picks" title="Featured Events"
        products={featured.slice(0, 6)} accent={accent} cta={{ href: "/shop" }}
      />
      <HowItWorksSection />
      <EventGridSection
        label="Limited time" title="Special Offers"
        subtitle="Tickets at honest prices — book before they're gone."
        products={deals.slice(0, 3)} accent={accent} cta={{ href: "/deals" }}
      />
      <EventpassFooter config={config} />
    </div>
  )
}
