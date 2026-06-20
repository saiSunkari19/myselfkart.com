"use client"

import { useState } from "react"
import { PageShell, SectionHeader, T } from "../_components"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const inputStyle = {
    width: "100%", border: `1.5px solid ${T.border}`, borderRadius: 12,
    padding: "12px 16px", fontSize: 14, outline: "none",
    boxSizing: "border-box" as const, color: T.text, background: T.bg,
  }

  return (
    <PageShell>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <SectionHeader label="Get in touch" title="Contact Us" subtitle="We typically respond within 2 hours during business hours." />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          {/* Form */}
          <div>
            {sent ? (
              <div style={{
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: T.radiusLg, padding: 40, textAlign: "center",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ color: "#166534", fontWeight: 700, marginBottom: 8, marginTop: 0 }}>Message sent!</h3>
                <p style={{ color: "#15803d", fontSize: 14, margin: 0 }}>We'll get back to you shortly.</p>
              </div>
            ) : (
              <div style={{
                background: T.bgCard, border: `1px solid ${T.border}`,
                borderRadius: T.radiusLg, padding: 32, boxShadow: T.shadow,
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ color: T.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Name *</label>
                    <input value={form.name} onChange={set("name")} placeholder="Your name" style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = T.accent}
                      onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  </div>
                  <div>
                    <label style={{ color: T.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Email *</label>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = T.accent}
                      onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  </div>
                  <div>
                    <label style={{ color: T.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Subject</label>
                    <select value={form.subject} onChange={set("subject")} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Select a topic</option>
                      <option>Booking Issue</option>
                      <option>Refund Request</option>
                      <option>List My Event</option>
                      <option>General Enquiry</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: T.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Message *</label>
                    <textarea value={form.message} onChange={set("message")} placeholder="How can we help?" rows={5} style={{ ...inputStyle, resize: "vertical" as const }}
                      onFocus={e => e.currentTarget.style.borderColor = T.accent}
                      onBlur={e => e.currentTarget.style.borderColor = T.border} />
                  </div>
                  <button onClick={() => setSent(true)} style={{
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "#fff", border: "none", borderRadius: 12,
                    padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%",
                  }}>Send Message →</button>
                </div>
              </div>
            )}
          </div>

          {/* Contact info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { icon: "📧", title: "Email Support", desc: "support@eventpass.in", sub: "We reply within 2 hours" },
              { icon: "💬", title: "Live Chat", desc: "Available Mon–Sat, 10am–7pm", sub: "Average response: 5 minutes" },
              { icon: "📞", title: "Phone", desc: "+91 98765 00000", sub: "Mon–Fri, 10am–6pm" },
              { icon: "🏢", title: "Office", desc: "Mumbai, Maharashtra, India", sub: "Not open to walk-ins" },
            ].map(item => (
              <div key={item.title} style={{
                display: "flex", gap: 16, background: T.bgSubtle,
                border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: "20px 24px",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: T.accentLight,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
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
      </div>
    </PageShell>
  )
}
