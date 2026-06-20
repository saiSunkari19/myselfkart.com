"use client"

import Link from "next/link"
import { PageShell, T } from "../_components"

export default function ConfirmationPage() {
  const bookingId = "EVT-2026-88421"

  return (
    <PageShell>
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        {/* Success state */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,#10b981,#059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px", fontSize: 36,
          boxShadow: "0 8px 32px rgba(16,185,129,0.3)",
        }}>✓</div>

        <h1 style={{ color: T.text, fontSize: 36, fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.5px" }}>
          You're going!
        </h1>
        <p style={{ color: T.textMuted, fontSize: 16, margin: "0 0 40px", lineHeight: 1.6 }}>
          Your booking is confirmed. Check your email for your tickets and QR code.
        </p>

        {/* Booking ID */}
        <div style={{
          background: T.bgSubtle, border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg, padding: "20px 28px", marginBottom: 28,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: T.textLight, fontSize: 12, marginBottom: 4 }}>BOOKING ID</div>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 22, letterSpacing: "1px" }}>{bookingId}</div>
          </div>
          <button style={{
            background: T.accentLight, color: T.accent, border: "none",
            borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Copy</button>
        </div>

        {/* QR Code placeholder */}
        <div style={{
          background: T.bgCard, border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg, padding: 32, marginBottom: 28, boxShadow: T.shadow,
        }}>
          <h3 style={{ color: T.text, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>Your Entry QR Code</h3>
          <div style={{
            width: 180, height: 180, margin: "0 auto 20px",
            background: T.bgSubtle, borderRadius: 12,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>▦</div>
            <div style={{ color: T.textLight, fontSize: 12 }}>QR Code</div>
          </div>
          <div style={{ color: T.text, fontWeight: 700 }}>Sunburn Festival 2026</div>
          <div style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>General Admission · Dec 27, 2026</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Pune Racecourse, Pune</div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 8,
            background: T.bgCard, border: `1.5px solid ${T.border}`,
            borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600,
            cursor: "pointer", color: T.text, boxShadow: T.shadow,
          }}>
            📥 Download Ticket
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 8,
            background: T.bgCard, border: `1.5px solid ${T.border}`,
            borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600,
            cursor: "pointer", color: T.text, boxShadow: T.shadow,
          }}>
            📅 Add to Calendar
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 8,
            background: T.bgCard, border: `1.5px solid ${T.border}`,
            borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600,
            cursor: "pointer", color: T.text, boxShadow: T.shadow,
          }}>
            📤 Share Event
          </button>
        </div>

        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 12, padding: "14px 20px", marginBottom: 40,
          display: "flex", gap: 10, alignItems: "center", textAlign: "left",
        }}>
          <span style={{ fontSize: 18 }}>📧</span>
          <p style={{ color: "#166534", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            A confirmation email with your tickets and QR code has been sent to your email address. Check your spam folder if you don't see it.
          </p>
        </div>

        <Link href="/preview/eventpass/events" style={{ textDecoration: "none" }}>
          <button style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff", border: "none", borderRadius: 12,
            padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>Discover More Events</button>
        </Link>
      </div>
    </PageShell>
  )
}
