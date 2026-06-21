"use client"

import { useState } from "react"
import { PageShell, SectionHeader, T } from "../_components"
import { useTemplateConfig } from "../../../../lib/template-config-context"

const FAQS = [
  {
    section: "Booking",
    items: [
      { q: "Do I need to create an account to book tickets?", a: "No. EventPass uses a guest checkout. Just provide your name, email, and phone number." },
      { q: "How will I receive my tickets?", a: "Your tickets and QR code are sent to your email immediately after booking." },
      { q: "Can I book tickets for someone else?", a: "Yes. You can enter a different attendee's name at checkout." },
      { q: "What payment methods are accepted?", a: "We accept all major cards, UPI, net banking, and wallets via Razorpay." },
    ],
  },
  {
    section: "Events",
    items: [
      { q: "How do I find events in my city?", a: "Use the city filter on the Events page, or browse by city on the homepage." },
      { q: "Can I get a refund if an event is cancelled?", a: "If an event is cancelled by the organiser, you will receive a full refund to your original payment method within 5–7 business days." },
      { q: "What is the refund policy?", a: "Refunds are available up to 48 hours before the event. See our Refund Policy for details." },
    ],
  },
  {
    section: "Tickets",
    items: [
      { q: "What is the difference between ticket types?", a: "Each event sets its own ticket types. Typically: General Admission gives standard entry, VIP includes premium areas and perks, and Early Bird is a discounted rate available for a limited time." },
      { q: "How do I use my QR code at the venue?", a: "Show the QR code from your confirmation email on your phone at the entry gate. It will be scanned for entry." },
      { q: "Can I transfer my ticket to someone else?", a: "Ticket transfer is not currently supported. The QR code is valid for the original booking details." },
    ],
  },
  {
    section: "Organiser",
    items: [
      { q: "How do I list my event on EventPass?", a: "Click 'List your event' in the navigation bar and fill in your event details. Our team will review and publish it within 24 hours." },
      { q: "What commission does EventPass charge?", a: "EventPass charges a 5% service fee on each ticket sold. There are no upfront listing fees." },
    ],
  },
]

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 12,
      overflow: "hidden", marginBottom: 8,
    }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: "100%", background: open ? T.accentLight : T.bgCard,
        border: "none", padding: "16px 20px", textAlign: "left",
        cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: T.text, fontWeight: 600, fontSize: 15 }}>{q}</span>
        <span style={{ color: T.accent, fontSize: 20, fontWeight: 300, flexShrink: 0, marginLeft: 12 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{
          padding: "0 20px 16px",
          background: T.accentLight, borderTop: `1px solid rgba(99,102,241,0.1)`,
        }}>
          <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.8, margin: "12px 0 0" }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <SectionHeader label="Help" title="Frequently Asked Questions" subtitle="Everything you need to know about EventPass" />

        {FAQS.map(section => (
          <div key={section.section} style={{ marginBottom: 48 }}>
            <h2 style={{ color: T.text, fontSize: 18, fontWeight: 800, marginBottom: 16, paddingLeft: 4 }}>{section.section}</h2>
            {section.items.map(item => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        ))}

        <div style={{
          background: T.bgSubtle, border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg, padding: 32, textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>💬</div>
          <h3 style={{ color: T.text, fontWeight: 700, marginBottom: 8, marginTop: 0 }}>Still have questions?</h3>
          <p style={{ color: T.textMuted, fontSize: 14, margin: "0 0 20px" }}>Our support team typically responds within 2 hours.</p>
          <a href={`${basePath}/contact`} style={{ textDecoration: "none" }}>
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
