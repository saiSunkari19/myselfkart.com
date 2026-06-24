"use client"

import Link from "next/link"

import { formatMoney } from "../../lib/format"
import type { OrderView } from "../../lib/views"

/**
 * Theme-agnostic order confirmation. Themes wrap this in their own chrome
 * (nav/footer/container); the success layout here is brand-adaptive — it styles
 * with the global `--store-*` custom properties (set on <html> for every tenant),
 * so it picks up each store's palette without per-theme markup.
 */
export function OrderSummary({ order }: { order: OrderView }) {
  const primary = "var(--store-primary, #111827)"
  const accent = "var(--store-accent, #374151)"
  const card: React.CSSProperties = {
    background: "#fafafa",
    border: "1px solid #ececec",
    borderRadius: 12,
  }

  return (
    <div className="order-confirmation" style={{ maxWidth: 640, margin: "0 auto", padding: "56px 20px 64px", textAlign: "center" }}>
      <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 18 }} aria-hidden>✅</div>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: primary, margin: "0 0 8px" }}>
        Thank you for your order
      </h1>
      <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 28px" }}>
        Order <strong style={{ color: "#374151" }}>#{order.display_id}</strong> is confirmed
        {order.email ? <> — a receipt will go to {order.email}</> : null}.
      </p>

      {/* Order ID highlight */}
      <div style={{ ...card, borderTop: `3px solid ${accent}`, padding: "18px 24px", marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#9ca3af", marginBottom: 6 }}>
          Order ID
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: accent, letterSpacing: 0.5 }}>
          #{order.display_id}
        </div>
      </div>

      {/* Line items */}
      <div style={{ ...card, padding: "8px 20px", marginBottom: 16, textAlign: "left" }}>
        {order.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid #f0f0f0",
              fontSize: 14,
              color: "#374151",
            }}
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt=""
                width={44}
                height={44}
                style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "#f1f1f1" }}
              />
            ) : null}
            <span style={{ flex: 1, minWidth: 0 }}>
              {item.handle ? (
                <Link href={`/products/${item.handle}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {item.title}
                </Link>
              ) : (
                item.title
              )}
              <span style={{ color: "#9ca3af" }}> × {item.quantity}</span>
            </span>
            <strong style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
              {formatMoney(item.total, order.currency_code)}
            </strong>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "14px 0",
            fontSize: 16,
            fontWeight: 800,
            color: primary,
          }}
        >
          <span>Total</span>
          <span>{formatMoney(order.total, order.currency_code)}</span>
        </div>
      </div>

      {/* What happens next */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, margin: "28px 0 32px" }}>
        {[
          { icon: "📦", title: "Packed Same Day", text: "We're picking and packing your order" },
          { icon: "🚚", title: "Delivery in 2–3 days", text: "Tracked and insured shipping" },
          { icon: "📱", title: "Updates by SMS", text: "You'll get tracking on your phone" },
        ].map((step) => (
          <div key={step.title} style={{ ...card, padding: "18px 14px" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }} aria-hidden>{step.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{step.title}</div>
            <div style={{ fontSize: 11.5, color: "#9ca3af", lineHeight: 1.5 }}>{step.text}</div>
          </div>
        ))}
      </div>

      <Link
        href="/"
        style={{
          display: "inline-block",
          background: primary,
          color: "#fff",
          padding: "13px 32px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Continue shopping →
      </Link>
    </div>
  )
}
