"use client"
import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function ContactPage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Get in Touch</div>
          <div className={s.pageHeaderTitle}>Contact Us</div>
          <div className={s.pageHeaderSub}>We typically respond within 2 hours on business days</div>
        </div>
      </div>
      <div className={s.container}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, padding: "48px 0 80px", alignItems: "start" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 24 }}>Send us a message</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className={s.formGroup}><label className={s.formLabel}>Name</label><input className={s.formInput} placeholder="Your full name" /></div>
                <div className={s.formGroup}><label className={s.formLabel}>Email</label><input className={s.formInput} type="email" placeholder="you@email.com" /></div>
              </div>
              <div className={s.formGroup}><label className={s.formLabel}>Subject</label>
                <select className={s.formSelect}>
                  <option>Order Issue</option>
                  <option>Product Query</option>
                  <option>Return / Refund</option>
                  <option>Warranty Claim</option>
                  <option>Technical Support</option>
                  <option>Other</option>
                </select>
              </div>
              <div className={s.formGroup}><label className={s.formLabel}>Message</label><textarea className={s.formInput} rows={5} placeholder="Describe your query..." style={{ height: "auto", padding: "12px 14px", resize: "vertical" }} /></div>
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`} style={{ alignSelf: "flex-start" }}>Send Message</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "📞", title: "Phone Support", lines: ["1800-VOLT-CARE (Toll Free)", "Mon–Sat 9am–9pm", "Sun 10am–6pm"] },
              { icon: "📧", title: "Email Support", lines: ["support@volt.in", "Response within 2 hours"] },
              { icon: "💬", title: "Live Chat", lines: ["Available on website", "Mon–Sat 9am–9pm"] },
            ].map(item => (
              <div key={item.title} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{item.title}</div>
                    {item.lines.map(l => <div key={l} style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{l}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
