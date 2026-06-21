"use client"

import { useTemplateConfig } from "../../../lib/template-config-context"
import Link from "next/link"
import React from "react"
import { useCart } from "./_cart"
import { type Event } from "./_data"

// ---------------------------------------------------------------------------
// Theme tokens
// ---------------------------------------------------------------------------

export const T = {
  bg: "#ffffff",
  bgSubtle: "#f8f8fc",
  bgCard: "#ffffff",
  border: "#e5e7eb",
  borderSubtle: "#f0f0f6",
  text: "#0f0f0f",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  accent: "#6366f1",
  accentLight: "#eef2ff",
  accentHover: "#4f46e5",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
  shadowLg: "0 12px 40px rgba(0,0,0,0.1)",
  radius: 14,
  radiusSm: 10,
  radiusLg: 20,
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export const NavBar = () => {
  const { basePath, config } = useTemplateConfig()
  const storeName = config?.store_name ?? "EventPass"
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { totalItems } = useCart()
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 40px)", height: 64,
      }}>
        <Link href={basePath || "/"} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "#fff",
          }}>E</div>
          <span style={{ color: T.text, fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>
            {storeName}
          </span>
        </Link>

        {/* Desktop links */}
        <div className="ep-nav-links" style={{ display: "flex", gap: 28 }}>
          {[
            { label: "Discover", href: `${basePath}/events` },
            { label: "Categories", href: `${basePath}/categories` },
            { label: "About", href: `${basePath}/about` },
            { label: "Contact", href: `${basePath}/contact` },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{
              color: T.textMuted, textDecoration: "none",
              fontSize: 14, fontWeight: 500,
            }}>{item.label}</Link>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href={`${basePath}/cart`} className="ep-nav-cart" style={{
            display: "flex", alignItems: "center", gap: 6,
            color: T.textMuted, textDecoration: "none",
            fontSize: 14, fontWeight: 500, padding: "8px 14px",
            borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
            position: "relative",
          }}>
            🛒 Cart
            {totalItems > 0 && (
              <span style={{
                position: "absolute", top: -7, right: -7,
                background: T.accent, color: "#fff",
                fontSize: 11, fontWeight: 700, lineHeight: 1,
                minWidth: 18, height: 18, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px",
              }}>
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
          <button className="ep-nav-cta" style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff", border: "none", borderRadius: T.radiusSm,
            padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            List your event
          </button>
          {/* Hamburger — mobile only */}
          <button
            className="ep-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: "none", background: "none", border: "none",
              cursor: "pointer", fontSize: 22, color: T.text, padding: 4,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="ep-mobile-menu" style={{
          borderTop: `1px solid ${T.border}`,
          background: "#fff", padding: "16px clamp(16px,4vw,40px)",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          {[
            { label: "Discover", href: `${basePath}/events` },
            { label: "Categories", href: `${basePath}/categories` },
            { label: "About", href: `${basePath}/about` },
            { label: "Contact", href: `${basePath}/contact` },
            { label: "🛒 Cart", href: `${basePath}/cart` },
          ].map(item => (
            <Link key={item.label} href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{ color: T.text, textDecoration: "none", fontSize: 15, fontWeight: 500 }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .ep-nav-links { display: none !important; }
          .ep-nav-cart { display: none !important; }
          .ep-nav-cta { display: none !important; }
          .ep-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const Footer = () => {
  const { basePath, config } = useTemplateConfig()
  const storeName = config?.store_name ?? "EventPass"
  return (
  <footer style={{
    background: T.bgSubtle, borderTop: `1px solid ${T.border}`,
    padding: "64px 40px 40px",
  }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 56 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800, color: "#fff",
            }}>E</div>
            <span style={{ color: T.text, fontWeight: 800, fontSize: 17 }}>{storeName}</span>
          </div>
          <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.8, maxWidth: 260, margin: 0 }}>
            Premium event discovery and ticket booking. No account needed. Just great experiences.
          </p>
        </div>
        {[
          {
            title: "Discover",
            links: [
              { label: "All Events", href: `${basePath}/events` },
              { label: "Categories", href: `${basePath}/categories` },
              { label: "Cities", href: `${basePath}/events` },
            ],
          },
          {
            title: "Help",
            links: [
              { label: "FAQ", href: `${basePath}/faq` },
              { label: "Contact", href: `${basePath}/contact` },
              { label: "About", href: `${basePath}/about` },
              { label: "Refund Policy", href: `${basePath}/refund` },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Privacy Policy", href: `${basePath}/privacy` },
              { label: "Terms & Conditions", href: `${basePath}/terms` },
            ],
          },
        ].map(col => (
          <div key={col.title}>
            <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 20 }}>{col.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {col.links.map(link => (
                <Link key={link.label} href={link.href} style={{
                  color: T.textMuted, textDecoration: "none", fontSize: 14,
                }}>{link.label}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        borderTop: `1px solid ${T.border}`, paddingTop: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: T.textLight, fontSize: 13 }}>
          © 2026 {storeName}. All rights reserved.
        </span>
        <span style={{
          color: T.accent, fontSize: 11, fontWeight: 600,
          background: T.accentLight, padding: "4px 12px", borderRadius: 100,
        }}>
          Template Preview
        </span>
      </div>
    </div>
  </footer>
  )
}

// ---------------------------------------------------------------------------
// EventCard
// ---------------------------------------------------------------------------

export const EventCard = ({ event }: { event: Event }) => {
  const { basePath } = useTemplateConfig()
  return (
  <Link href={`${basePath}/events/${event.id}`} style={{ textDecoration: "none" }}>
    <div style={{
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
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
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

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------

export const SectionHeader = ({
  label, title, subtitle, action,
}: { label: string; title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    {/* Label → Heading: 0px gap */}
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: T.accentLight, borderRadius: 100,
      padding: "5px 14px", marginBottom: 0,
    }}>
      <span style={{ color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
    {/* Title row — action (e.g. "View all") sits inline with heading */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <h2 style={{
        color: T.text, fontSize: "clamp(22px, 3vw, 36px)",
        fontWeight: 800, margin: 0, letterSpacing: "-0.5px",
      }}>{title}</h2>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
    {/* Heading → Subtitle: 10px gap */}
    {subtitle && (
      <p style={{ color: T.textMuted, fontSize: 16, margin: "10px 0 0" }}>{subtitle}</p>
    )}
  </div>
)

// ---------------------------------------------------------------------------
// PageShell — wraps every inner page with Navbar + padding + Footer
// ---------------------------------------------------------------------------

export const PageShell = ({ children, fullWidth }: { children: React.ReactNode; fullWidth?: boolean }) => (
  <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
    <NavBar />
    <div style={{ paddingTop: 64 }}>
      <main style={{ maxWidth: fullWidth ? "100%" : 1240, margin: "0 auto", padding: fullWidth ? 0 : "60px 40px" }}>
        {children}
      </main>
    </div>
    <Footer />
  </div>
)
