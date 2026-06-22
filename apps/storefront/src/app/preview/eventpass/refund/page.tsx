"use client"

import { PageShell, T } from "../_components"
import { useTemplateConfig } from "../../../../lib/template-config-context"

export default function RefundPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", marginBottom: 12 }}>LEGAL</div>
          <h1 style={{ color: T.text, fontSize: 40, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>Refund Policy</h1>
          <p style={{ color: T.textLight, fontSize: 14 }}>Last updated: June 19, 2026</p>
        </div>

        {/* Quick summary */}
        <div style={{
          background: T.accentLight, border: `1px solid rgba(99,102,241,0.2)`,
          borderRadius: T.radiusLg, padding: "24px 28px", marginBottom: 48,
        }}>
          <h2 style={{ color: T.accent, fontWeight: 800, fontSize: 17, margin: "0 0 12px" }}>Quick Summary</h2>
          <ul style={{ color: T.textMuted, fontSize: 14, lineHeight: 2, margin: 0, paddingLeft: 20 }}>
            <li>Cancelled by organiser → <strong>Full refund</strong> within 5–7 business days</li>
            <li>Cancelled by you ≥ 48hrs before event → <strong>Full refund</strong> minus service fee</li>
            <li>Cancelled by you &lt; 48hrs before event → <strong>No refund</strong></li>
            <li>Event postponed → <strong>Ticket valid for new date</strong> or full refund available</li>
          </ul>
        </div>

        {[
          {
            title: "1. Refunds for Cancelled Events",
            body: "If an event is cancelled by the organiser, you will receive a full refund — including the service fee — to your original payment method. Refunds are processed within 5–7 business days. You will be notified by email as soon as a cancellation is confirmed.",
          },
          {
            title: "2. Refunds for Postponed Events",
            body: "If an event is postponed to a new date, your tickets remain valid for the new date. If you cannot attend the new date, you may request a full refund within 72 hours of the postponement announcement.",
          },
          {
            title: "3. Buyer-Initiated Cancellations",
            body: "If you wish to cancel your booking, you must do so at least 48 hours before the event start time. You will receive a refund of the ticket price minus the service fee. Requests made less than 48 hours before the event are non-refundable.",
          },
          {
            title: "4. Non-Refundable Situations",
            body: "Tickets are non-refundable if: the event occurs as scheduled and you do not attend, you cancel within 48 hours of the event, or you violate the event organiser's terms and are refused entry.",
          },
          {
            title: "5. How to Request a Refund",
            body: "Email refunds@eventpass.in with your booking ID and reason for refund. We aim to process all refund requests within 2 business days of receipt.",
          },
          {
            title: "6. Service Fees",
            body: "The 5% service fee charged by EventPass is non-refundable in buyer-initiated cancellations. It is refunded in full in the case of organiser-initiated cancellations.",
          },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 36 }}>
            <h2 style={{ color: T.text, fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{s.title}</h2>
            <p style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.9, margin: 0 }}>{s.body}</p>
          </div>
        ))}

        <div style={{
          background: T.bgSubtle, border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg, padding: "28px 32px", textAlign: "center",
        }}>
          <p style={{ color: T.textMuted, fontSize: 14, margin: "0 0 16px" }}>Need help with a refund?</p>
          <a href={`${basePath}/about`} style={{ textDecoration: "none" }}>
            <button style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Contact Support</button>
          </a>
        </div>
      </div>
    </PageShell>
  )
}
