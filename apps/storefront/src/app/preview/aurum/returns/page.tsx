"use client"

import Link from "next/link"
import { PageShell, GoldDivider } from "../_components"
import s from "../_styles.module.css"
import { useTemplateConfig } from "../../../../lib/template-config-context"

export default function ReturnsPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>Our Promise</div>
        <h1 className={s.pageHeaderTitle}>Returns & Exchange Policy</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>We stand behind every piece we sell. If you are not completely satisfied, we make it right.</p>
      </div>

      <div className={s.container}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 0 100px" }}>

          {/* Highlights */}
          <div className={s.grid3} style={{ gap: 20, marginBottom: 64 }}>
            {[
              { icon: "30", unit: "Days", label: "Full Returns Window", sub: "No questions asked" },
              { icon: "∞", unit: "", label: "Lifetime Exchange", sub: "At current gold value" },
              { icon: "₀", unit: "", label: "Return Pickup Fee", sub: "Free doorstep collection" },
            ].map(h => (
              <div key={h.label} style={{ textAlign: "center", padding: "32px 20px", background: "#fdf9f4", borderTop: "3px solid #b8962e" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 40, color: "#b8962e", fontWeight: 400, lineHeight: 1 }}>{h.icon}<span style={{ fontSize: 18 }}>{h.unit}</span></div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#1a1410", margin: "12px 0 4px" }}>{h.label}</div>
                <div style={{ fontSize: 12, color: "#a09080" }}>{h.sub}</div>
              </div>
            ))}
          </div>

          {[
            {
              title: "Return Policy",
              items: [
                ["Return Window", "30 days from the date of delivery."],
                ["Eligible Items", "Any unworn Aurum piece in its original condition, with all certificates, packaging, and tags intact."],
                ["Ineligible Items", "Custom or personalised pieces, pierced jewellery, and items showing signs of wear or alteration cannot be returned."],
                ["Refund Method", "Full refund to the original payment method within 5–7 business days of us receiving and verifying the returned item."],
                ["Return Pickup", "We arrange complimentary doorstep pickup from anywhere in India. Call or email us to schedule a pickup within your return window."],
              ]
            },
            {
              title: "Exchange Policy",
              items: [
                ["Exchange Window", "Any Aurum piece purchased from our stores or website can be exchanged within 90 days for a different piece of equal or higher value."],
                ["Lifetime Exchange", "Beyond 90 days, any Aurum piece can be brought to any of our five stores and exchanged at its current gold value — with no time limit and no exchange fee."],
                ["How It Works", "Bring the piece to any Aurum store along with the original purchase receipt or order number. Our team will assess the current value and apply it as credit toward your new purchase."],
                ["Custom Pieces", "Custom pieces are not eligible for the standard exchange policy but may be assessed individually by our team."],
              ]
            },
            {
              title: "How to Initiate a Return",
              items: [
                ["Step 1 — Contact Us", "Email returns@aurumjewels.in or call +91 22 6789 0124 with your order number and reason for return."],
                ["Step 2 — Schedule Pickup", "Our team will schedule a complimentary insured pickup from your doorstep within 48 hours."],
                ["Step 3 — Inspection", "Once received, our team will inspect the item within 2 business days."],
                ["Step 4 — Refund", "Approved refunds are processed within 5–7 business days to your original payment method."],
              ]
            },
            {
              title: "Damaged or Incorrect Items",
              items: [
                ["Report Immediately", "If you receive a damaged or incorrect item, contact us within 48 hours of delivery with photographs."],
                ["Resolution", "We will arrange immediate replacement or a full refund at your choice, including all return shipping costs."],
              ]
            },
          ].map(section => (
            <div key={section.title} style={{ marginBottom: 56 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: "#1a1410", marginBottom: 24, paddingBottom: 12, borderBottom: "1px solid #e8e0d4" }}>
                {section.title}
              </h2>
              {section.items.map(([label, detail]) => (
                <div key={label} className={s.labelRow} style={{ gap: 20, marginBottom: 16, padding: "12px 0", borderBottom: "1px solid #f5f0e8" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1410" }}>{label}</div>
                  <div style={{ fontSize: 14, color: "#6b5f52", lineHeight: 1.7 }}>{detail}</div>
                </div>
              ))}
            </div>
          ))}

          <div style={{ background: "#fdf9f4", border: "1.5px solid #e8e0d4", padding: "32px 40px", textAlign: "center", borderTop: "3px solid #b8962e" }}>
            <p style={{ fontSize: 14, color: "#6b5f52", lineHeight: 1.8, marginBottom: 20 }}>
              For return and exchange queries, our team is available Monday–Friday, 10am–7pm IST.
            </p>
            <Link href={`${basePath}/contact`} className={`${s.btn} ${s.btnGold}`}>Contact Us</Link>
          </div>

        </div>
      </div>
    </PageShell>
  )
}
