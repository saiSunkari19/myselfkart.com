"use client"
import { useState } from "react"
import Link from "next/link"
import { PageShell } from "../_components"
import s from "../_styles.module.css"

const FAQS = [
  { cat: "Orders", q: "How do I track my order?", a: "Once dispatched, you'll receive a tracking link via SMS and email. You can also visit our website and enter your order ID in the Track Order section." },
  { cat: "Orders", q: "Can I cancel my order after placing it?", a: "Orders can be cancelled within 1 hour of placement if not yet dispatched. Contact our support team immediately at 1800-VOLT-CARE." },
  { cat: "Delivery", q: "What is the delivery timeline?", a: "Standard delivery takes 2–4 business days. Express delivery (same-day or next-day) is available in select metros for orders placed before 1 PM." },
  { cat: "Delivery", q: "Is there free delivery?", a: "Yes — all orders above ₹999 qualify for free standard delivery. Orders below ₹999 are charged ₹99 for delivery." },
  { cat: "Returns", q: "What is your return policy?", a: "We offer a 10-day hassle-free return policy for all products in original condition with all accessories and packaging. Simply raise a return request from your order page." },
  { cat: "Returns", q: "How long does a refund take?", a: "Refunds are processed within 5–7 business days after we receive and inspect the returned product. Credit/debit card refunds may take an additional 2–3 banking days." },
  { cat: "Products", q: "Are all products genuine?", a: "Yes — Volt is an authorised dealer for all brands we sell. Every product comes with a valid manufacturer warranty and is 100% genuine." },
  { cat: "Products", q: "Do products come with warranty?", a: "All products carry the standard manufacturer warranty (typically 1 year). Extended warranty options are available at checkout for select products." },
  { cat: "Payments", q: "What payment methods are accepted?", a: "We accept all major credit/debit cards, UPI (PhonePe, Google Pay, Paytm), net banking (60+ banks), EMI (No-Cost EMI on select cards), and NEFT/RTGS for high-value orders." },
  { cat: "Payments", q: "Is No-Cost EMI available?", a: "Yes — No-Cost EMI is available on purchases above ₹5,000 for 3, 6, and 9-month tenures on HDFC, ICICI, Axis, and SBI credit cards." },
]

const cats = ["All", ...Array.from(new Set(FAQS.map(f => f.cat)))]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)
  const [cat, setCat] = useState("All")
  const filtered = FAQS.filter(f => cat === "All" || f.cat === cat)
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Help Centre</div>
          <div className={s.pageHeaderTitle}>Frequently Asked Questions</div>
          <div className={s.pageHeaderSub}>Can't find an answer? <Link href="/preview/volt/contact" style={{ color: "var(--accent)" }}>Contact us</Link></div>
        </div>
      </div>
      <div className={s.container}>
        <div style={{ display: "flex", gap: 8, padding: "28px 0 20px", flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} className={`${s.chip} ${cat === c ? s.chipActive : ""}`} onClick={() => { setCat(c); setOpen(null) }}>{c}</button>
          ))}
        </div>
        <div style={{ maxWidth: 760 }}>
          {filtered.map((faq, i) => (
            <div key={i} className={s.faqItem}>
              <button className={s.faqQ} onClick={() => setOpen(open === i ? null : i)}>
                {faq.q}
                <span className={`${s.faqChevron} ${open === i ? "open" : ""}`}>⌄</span>
              </button>
              {open === i && <div className={s.faqA}>{faq.a}</div>}
            </div>
          ))}
        </div>
        <div style={{ padding: "48px 0", maxWidth: 760 }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Still have questions?</div>
            <p style={{ fontSize: 13.5, color: "var(--text2)", marginBottom: 16 }}>Our team typically responds within 2 hours.</p>
            <Link href="/preview/volt/contact" className={`${s.btn} ${s.btnPrimary}`}>Contact Support</Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
