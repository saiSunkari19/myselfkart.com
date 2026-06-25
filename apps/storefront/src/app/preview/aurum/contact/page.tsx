"use client"

import { useState } from "react"
import { PageShell, Reveal } from "../_components"
import { useTemplateConfig } from "../../../../lib/template-config-context"
import s from "../_styles.module.css"

export default function ContactPage() {
  const { config } = useTemplateConfig()
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>We're Here for You</div>
        <h1 className={s.pageHeaderTitle}>Contact Aurum</h1>
        <p className={s.pageHeaderSub}>
          For purchases, appointments, custom orders, or any enquiry — our team responds within 4 business hours.
        </p>
      </div>

      <div className={s.container}>
        <div className={s.contactGrid}>
          {/* Info */}
          <div>
            <Reveal>
              <span className={s.sectionLabel}>Get in Touch</span>
              <h2 className={s.sectionTitle} style={{ fontSize: 36 }}>How can we help?</h2>
            </Reveal>

            {[
              { icon: "📧", label: "Email", text: config?.contact_email ? `${config.contact_email}\nFor general enquiries` : "hello@aurum.in\nFor general enquiries" },
              { icon: "📱", label: "Phone", text: config?.contact_phone ? `${config.contact_phone}\nMon–Sat 10am–7pm` : "+91 98000 00000\nMon–Sat 10am–7pm" },
              { icon: "💍", label: "Bridal Enquiries", text: "bridal@aurum.in\nAppointments · Custom sets · Consultations" },
              { icon: "📍", label: "Head Office", text: config?.business_address || "14 Johari Bazaar, Jaipur 302003\nBy appointment only" },
            ].map((item, i) => (
              <Reveal key={item.label} delay={(i % 4) as 0|1|2|3}>
                <div className={s.contactItem}>
                  <div className={s.contactIcon}>{item.icon}</div>
                  <div>
                    <div className={s.contactLabel}>{item.label}</div>
                    <div className={s.contactText} style={{ whiteSpace: "pre-line" }}>{item.text}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Form */}
          <div>
            {sent ? (
              <div style={{ textAlign: "center", padding: "80px 40px", background: "#fdf9f4", border: "1px solid #e8e0d4" }}>
                <div style={{ fontSize: 40, marginBottom: 20 }}>✦</div>
                <h3 style={{ fontSize: 24, fontWeight: 300, color: "#1a1410", marginBottom: 10 }}>Thank you.</h3>
                <p style={{ fontSize: 14, color: "#6b5f52" }}>We'll respond within 4 business hours.</p>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setSent(true) }}>
                <div className={s.formBlock}>
                  <div className={s.formBlockTitle}>Send a Message</div>
                  <div className={s.formGrid}>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Full Name</label>
                      <input className={s.formInput} value={form.name} onChange={set("name")} required placeholder="Your name" />
                    </div>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Email</label>
                      <input className={s.formInput} type="email" value={form.email} onChange={set("email")} required placeholder="your@email.com" />
                    </div>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Phone</label>
                      <input className={s.formInput} type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98000 00000" />
                    </div>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Subject</label>
                      <select className={s.formSelect} value={form.subject} onChange={set("subject")} required>
                        <option value="">Select topic</option>
                        <option>Product Enquiry</option>
                        <option>Bridal Consultation</option>
                        <option>Custom Order</option>
                        <option>Order Status</option>
                        <option>Return / Exchange</option>
                        <option>Certification</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className={`${s.formGroup} ${s.formGroupFull}`}>
                      <label className={s.formLabel}>Message</label>
                      <textarea
                        className={s.formInput}
                        value={form.message}
                        onChange={set("message") as any}
                        required
                        rows={6}
                        placeholder="Tell us how we can help…"
                        style={{ resize: "vertical", fontFamily: "inherit" }}
                      />
                    </div>
                  </div>
                  <button type="submit" className={`${s.btn} ${s.btnGold} ${s.btnFull} ${s.btnLg}`} style={{ marginTop: 8 }}>
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
