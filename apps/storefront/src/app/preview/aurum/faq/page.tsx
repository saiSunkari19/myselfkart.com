"use client"

import { useState } from "react"
import Link from "next/link"
import { PageShell, Reveal, GoldDivider } from "../_components"
import s from "../_styles.module.css"
import { useTemplateConfig } from "../../../../lib/template-config-context"

const FAQS = [
  { category: "Certification", q: "What does BIS Hallmarking mean?", a: "BIS (Bureau of Indian Standards) hallmarking is the government-mandated quality certification for gold and silver jewellery in India. It guarantees the purity of the metal — 916 means 91.6% pure gold (22K), 750 means 75% pure gold (18K). Every Aurum gold and silver piece carries a BIS hallmark." },
  { category: "Certification", q: "Do all diamonds come with a GIA certificate?", a: "Every diamond above 0.30 carats sold by Aurum comes with a GIA (Gemological Institute of America) certificate. The certificate number is laser-inscribed on the diamond's girdle and can be verified on GIA's website. Smaller diamonds are batch-certified and documented." },
  { category: "Certification", q: "How do I verify my certificate?", a: "GIA certificates can be verified at gia.edu/report-check. BIS hallmarks can be verified through the BIS Care app. All Aurum certificates include QR codes that link directly to the certifying laboratory's online verification system." },
  { category: "Shipping", q: "Do you offer free shipping?", a: "Yes — all orders above ₹10,000 qualify for free insured shipping. Orders below ₹10,000 are charged ₹299 for insured delivery. Every shipment is insured for its full declared value and tracked in real time." },
  { category: "Shipping", q: "How long does delivery take?", a: "Standard delivery takes 3–5 business days. Express delivery (1–2 business days) is available in Mumbai, Delhi, Bangalore, Chennai, and Hyderabad at ₹499. Bridal and high-value custom orders may take 2–3 additional days for extra security verification." },
  { category: "Returns", q: "What is your return policy?", a: "We accept returns within 30 days of delivery for a full refund to your original payment method. Items must be in original condition with all certificates and packaging intact. We arrange free doorstep pickup for all returns." },
  { category: "Returns", q: "What is the lifetime exchange policy?", a: "Any Aurum piece can be exchanged at any of our stores at any time for its current gold value. There is no time limit and no exchange fee. This is our commitment to the enduring value of Aurum jewellery." },
  { category: "Products", q: "Can I customise a jewellery piece?", a: "Yes — all five of our stores offer custom jewellery design services. Bring your inspiration or describe your vision to our specialists. We will create detailed design renderings before production begins. Custom pieces typically take 8–16 weeks." },
  { category: "Products", q: "How is the making charge calculated?", a: "Making charges are calculated per gram of gold and vary by design complexity — typically ₹800–₹1,600 per gram for standard designs and higher for intricate handcrafted pieces. We display making charges transparently on each product page." },
  { category: "Products", q: "Do you offer jewellery repair services?", a: "Yes — we offer repair and cleaning services at all five stores. Cleaning and polishing is complimentary for all Aurum pieces. Repairs are charged based on the work required and are communicated upfront before any work begins." },
  { category: "Payments", q: "What payment methods do you accept?", a: "We accept all major credit and debit cards, UPI, net banking from 50+ banks, EMI options on credit cards (0% EMI available for orders above ₹25,000 on select cards), and secure NEFT/RTGS for high-value orders. Cash on delivery is not available." },
  { category: "Payments", q: "Is EMI available?", a: "Yes — 0% EMI is available on Aurum purchases above ₹25,000 on HDFC, ICICI, SBI, and Axis credit cards for 3, 6, and 9-month tenures. Standard EMI is available on all major credit cards." },
]

const categories = ["All", ...Array.from(new Set(FAQS.map(f => f.category)))]

export default function FAQPage() {
  const { basePath } = useTemplateConfig()
  const [open, setOpen] = useState<number | null>(0)
  const [activeCategory, setActiveCategory] = useState("All")

  const filtered = FAQS.filter(f => activeCategory === "All" || f.category === activeCategory)

  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>Help Centre</div>
        <h1 className={s.pageHeaderTitle}>Frequently Asked Questions</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>
          Everything you need to know about Aurum. Can't find an answer? <Link href={`${basePath}/contact`} style={{ color: "#b8962e" }}>Contact us</Link>.
        </p>
      </div>

      <div className={s.container}>
        {/* Category filter */}
        <div className={s.tagPills} style={{ justifyContent: "center", padding: "48px 0 56px" }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${s.tagPill} ${activeCategory === cat ? s.tagPillActive : ""}`}
              onClick={() => { setActiveCategory(cat); setOpen(null) }}
            >{cat}</button>
          ))}
        </div>

        <div className={s.faqList}>
          {filtered.map((faq, i) => (
            <div key={i} className={s.faqItem}>
              <button className={s.faqQ} onClick={() => setOpen(open === i ? null : i)}>
                {faq.q}
                <span className={`${s.faqChevron} ${open === i ? s.open : ""}`}>⌄</span>
              </button>
              {open === i && <div className={s.faqA}>{faq.a}</div>}
            </div>
          ))}
        </div>

        <Reveal>
          <div style={{ textAlign: "center", padding: "80px 0 60px" }}>
            <div style={{ background: "#fdf9f4", borderTop: "2px solid #b8962e", padding: "48px", display: "inline-block", maxWidth: 480 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
              <h3 style={{ fontSize: 20, fontWeight: 400, color: "#1a1410", marginBottom: 10 }}>Still have questions?</h3>
              <p style={{ fontSize: 13, color: "#6b5f52", marginBottom: 24 }}>Our team typically responds within 4 business hours.</p>
              <Link href={`${basePath}/contact`} className={`${s.btn} ${s.btnGold}`}>Contact Us</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  )
}
