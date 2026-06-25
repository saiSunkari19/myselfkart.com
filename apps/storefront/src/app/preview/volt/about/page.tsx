"use client"

import { PageShell, Reveal } from "../_components"
import { useTemplateConfig } from "../../../../lib/template-config-context"
import s from "./../_styles.module.css"

const DEFAULT_ABOUT_STATS = [
  { value: "50L+", label: "Happy Customers" },
  { value: "40+", label: "Brand Partners" },
  { value: "1,000+", label: "Products" },
  { value: "10+", label: "Years of Trust" },
]

export default function AboutPage() {
  const { config } = useTemplateConfig()
  const stats = config?.sections?.about_stats?.items ?? DEFAULT_ABOUT_STATS
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Our Story</div>
          <div className={s.pageHeaderTitle}>About Volt</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: "relative", height: 320, overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&q=85" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
        <div style={{ position: "absolute", inset: 0, background: "#0f172a", opacity: 0.5 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>50 Lakh+ Customers</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Trusted since 2014</div>
          </div>
        </div>
      </div>

      <div className={s.container}>
        <div className={s.infoContent}>
          <Reveal>
            <div className={s.infoSection}>
              <h2>Who We Are</h2>
              {config?.about_text ? (
                <p style={{ whiteSpace: "pre-line" }}>{config.about_text}</p>
              ) : (
                <>
                  <p>Volt Electronics is India's most trusted authorised electronics retailer, founded in 2014 with a single mission: make premium technology accessible to every Indian at fair prices, with an experience that matches the products we sell.</p>
                  <p>We are an authorised dealer for Apple, Samsung, Sony, Dell, OnePlus, Dyson, Nothing, Google, DJI, GoPro, and 40+ other leading technology brands. Every product we sell is 100% genuine, with full manufacturer warranty.</p>
                </>
              )}
            </div>
          </Reveal>
          <Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, margin: "40px 0" }}>
              {stats.map((stat: typeof DEFAULT_ABOUT_STATS[number], i: number) => (
                <div key={stat.label ?? i} style={{ textAlign: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px 16px", borderTop: "3px solid var(--accent)" }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "var(--accent)" }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <div className={s.infoSection}>
              <h2>Our Promise</h2>
              <p>We believe buying electronics should be simple, transparent, and trustworthy. Every product we list is:</p>
              <ul>
                <li>100% genuine, sourced directly from brand-authorised distributors</li>
                <li>Covered by full manufacturer warranty from day one</li>
                <li>Eligible for 10-day returns — no questions asked</li>
                <li>Dispatched same day for orders placed before 3 PM</li>
                <li>Shipped with premium packaging to prevent damage in transit</li>
              </ul>
            </div>
          </Reveal>

          {/* Contact — merged in from the old standalone /contact page */}
          <Reveal>
            <div className={s.infoSection}>
              <h2>Get in Touch</h2>
              <p>We typically respond within 2 hours on business days.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 20 }}>
                {[
                  { icon: "📞", title: "Phone Support", lines: config?.contact_phone ? [config.contact_phone, "Mon–Sat 9am–9pm", "Sun 10am–6pm"] : ["1800-VOLT-CARE (Toll Free)", "Mon–Sat 9am–9pm", "Sun 10am–6pm"] },
                  { icon: "📧", title: "Email Support", lines: config?.contact_email ? [config.contact_email, "Response within 2 hours"] : ["support@volt.in", "Response within 2 hours"] },
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
          </Reveal>
        </div>
      </div>
    </PageShell>
  )
}
