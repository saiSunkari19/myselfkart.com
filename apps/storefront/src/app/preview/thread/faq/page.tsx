"use client"

import { useState } from "react"
import Link from "next/link"
import { PageShell } from "../_components"
import { useTemplateConfig } from "../../../../lib/template-config-context"
import s from "../_styles.module.css"

const FAQS = [
  {
    q: "What is your return policy?",
    a: "We offer free returns within 30 days of delivery. Items must be unworn, unwashed, and in their original condition with tags attached. Simply initiate a return from your order confirmation email and we'll arrange a pickup.",
  },
  {
    q: "How long does delivery take?",
    a: "Standard delivery takes 3–5 business days across India. Express delivery (1–2 business days) is available in major metros for an additional ₹149. You'll receive a tracking link via SMS and email once your order ships.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes — all orders above ₹2,999 ship free. For orders below that threshold, shipping is a flat ₹199.",
  },
  {
    q: "How do I find my size?",
    a: "Each product page includes a size guide with measurements in centimetres. We recommend measuring your chest, waist, and hips and comparing to our guide. If you're between sizes, we generally suggest sizing up for a relaxed fit or sizing down for a closer fit.",
  },
  {
    q: "Are your fabrics really 100% natural?",
    a: "Yes, with one exception: some of our stretch fabrics include a small percentage of elastane (typically 3–5%) for movement. We note this in every product's details. Everything else — linen, cotton, wool, Tencel, cupro — is natural fibre only.",
  },
  {
    q: "Can I exchange for a different size?",
    a: "Yes. Exchanges are processed the same way as returns — just indicate in your return request that you'd like a different size. If the new size is in stock, we'll ship it the same day we receive your returned item.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we ship across India only. International shipping to UAE, UK, and Singapore is coming in Q4 2026. Sign up for our newsletter to be notified when it launches.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex), UPI (GPay, PhonePe, Paytm), net banking from 50+ banks, and Cash on Delivery for orders up to ₹10,000.",
  },
  {
    q: "How do I care for my Thread pieces?",
    a: "Most of our pieces are machine-washable on a cold, gentle cycle. Specific care instructions are printed on the garment label and listed on the product page. As a general rule: cold water, gentle cycle, air dry — and your Thread pieces will last for years.",
  },
  {
    q: "Do you have a physical store?",
    a: "We have a studio in Bandra West, Mumbai that's open to visit by appointment. We're also stocked at select multi-brand stores in Mumbai, Bangalore, and Delhi — see the full list on our Stockists page.",
  },
]

export default function FAQPage() {
  const { basePath } = useTemplateConfig()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <PageShell>
      <div className={s.container}>
        <div className={`${s.pageTitle} ${s.sectionCenter}`}>
          <div className={s.pageTitleLabel}>Help centre</div>
          <h1 className={s.pageTitleText}>Frequently Asked Questions</h1>
          <p className={s.pageTitleSub}>Everything you need to know. Can't find the answer? <Link href={`${basePath}/about`} style={{ color: "#c4956a" }}>Contact us</Link>.</p>
        </div>

        <div className={s.faqList}>
          {FAQS.map((faq, i) => (
            <div key={i} className={s.faqItem}>
              <button className={s.faqQuestion} onClick={() => setOpen(open === i ? null : i)}>
                {faq.q}
                <span className={`${s.faqChevron} ${open === i ? s.open : ""}`}>⌄</span>
              </button>
              {open === i && (
                <div className={s.faqAnswer}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "80px 0 60px" }}>
          <div style={{ background: "#f2efe9", borderRadius: 20, padding: "48px", display: "inline-block", maxWidth: 480 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>💬</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Still have questions?</h3>
            <p style={{ fontSize: 14, color: "#6b6560", marginBottom: 24 }}>
              Our team usually replies within a few hours on weekdays.
            </p>
            <Link href={`${basePath}/about`} className={s.btn}>Get in Touch</Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
