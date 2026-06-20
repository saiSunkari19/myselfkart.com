"use client"

import { useState } from "react"
import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.pageTitle}>
          <div className={s.pageTitleLabel}>Get in touch</div>
          <h1 className={s.pageTitleText}>Contact Us</h1>
          <p className={s.pageTitleSub}>We're a small team. We read every message.</p>
        </div>

        <div className={s.contactLayout}>
          {/* Info */}
          <div className={s.contactInfo}>
            <div>
              <div className={s.sectionLabel}>Reach us</div>
              <h2 className={s.sectionTitle} style={{ fontSize: 32 }}>We'd love to<br />hear from you.</h2>
              <p style={{ fontSize: 14, color: "#6b6560", lineHeight: 1.8, marginTop: 12 }}>
                Questions about sizing, an order, or just want to know more about Thread? Send us a message and we'll get back within one business day.
              </p>
            </div>

            {[
              { icon: "📧", title: "Email", text: "hello@thread.in" },
              { icon: "📱", title: "Phone", text: "+91 98000 00000\nMon–Fri, 10am–6pm IST" },
              { icon: "📍", title: "Studio", text: "14 Linking Road, Bandra West\nMumbai, 400050" },
              { icon: "⏱️", title: "Response Time", text: "Within 1 business day" },
            ].map(item => (
              <div key={item.title} className={s.contactItem}>
                <div className={s.contactItemIcon}>{item.icon}</div>
                <div>
                  <div className={s.contactItemTitle}>{item.title}</div>
                  <div className={s.contactItemText} style={{ whiteSpace: "pre-line" }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div>
            {sent ? (
              <div style={{
                background: "#f0f9f0", border: "1px solid #bbf7d0",
                borderRadius: 16, padding: 48, textAlign: "center",
              }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>✉️</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Message sent!</h3>
                <p style={{ fontSize: 14, color: "#6b6560" }}>
                  We'll get back to you within one business day. Check your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={s.formSection}>
                <div className={s.formSectionTitle}>Send a Message</div>
                <div className={s.formGrid}>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Your Name</label>
                    <input className={s.formInput} value={form.name} onChange={set("name")} required placeholder="Priya Sharma" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Email</label>
                    <input className={s.formInput} type="email" value={form.email} onChange={set("email")} required placeholder="you@email.com" />
                  </div>
                  <div className={`${s.formGroup} ${s.fullWidth}`}>
                    <label className={s.formLabel}>Subject</label>
                    <select className={s.formSelect} value={form.subject} onChange={set("subject")} required>
                      <option value="">Select a topic</option>
                      <option>Order & Shipping</option>
                      <option>Returns & Refunds</option>
                      <option>Sizing & Fit</option>
                      <option>Product Question</option>
                      <option>Press & Collaborations</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className={`${s.formGroup} ${s.fullWidth}`}>
                    <label className={s.formLabel}>Message</label>
                    <textarea
                      className={s.formInput}
                      value={form.message}
                      onChange={set("message") as any}
                      required
                      rows={5}
                      placeholder="Tell us how we can help…"
                      style={{ resize: "vertical" }}
                    />
                  </div>
                </div>
                <button type="submit" className={`${s.btn} ${s.btnFull}`} style={{ marginTop: 8 }}>
                  Send Message →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
