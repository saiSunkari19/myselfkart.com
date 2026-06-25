"use client"

import Link from "next/link"
import { PageShell } from "../_components"
import { useTemplateConfig } from "../../../../lib/template-config-context"
import s from "../_styles.module.css"

export default function ReturnsPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Hassle-Free</div>
          <div className={s.pageHeaderTitle}>Return Policy</div>
          <div className={s.pageHeaderSub}>10-day easy returns on all products — no questions asked</div>
        </div>
      </div>
      <div className={s.container}>
        <div className={s.grid4} style={{ padding: "40px 0" }}>
          {[{ icon: "10", unit: "Days", label: "Return Window" }, { icon: "₀", unit: "", label: "Return Pickup Fee" }, { icon: "7", unit: "Days", label: "Refund Timeline" }, { icon: "100%", unit: "", label: "Refund Guaranteed" }].map(h => (
            <div key={h.label} style={{ textAlign: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px 16px", borderTop: "3px solid var(--accent)" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "var(--accent)" }}>{h.icon}<span style={{ fontSize: 16 }}>{h.unit}</span></div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, fontWeight: 600 }}>{h.label}</div>
            </div>
          ))}
        </div>
        <div className={s.infoContent} style={{ paddingTop: 0 }}>
          {[
            { title: "Return Eligibility", content: ["Products must be returned within 10 days of delivery.", "Item must be unused, in original condition, with all accessories, manuals, and original packaging.", "A valid Volt purchase invoice must accompany the return.", "Products showing signs of use, physical damage, or missing accessories may not be eligible for return."] },
            { title: "Non-Returnable Items", content: ["Consumable products (batteries, ink cartridges) once opened", "Software, digital products, and gift cards once activated", "Products that have been customised or engraved", "Large appliances once installed", "Products damaged due to misuse by the customer"] },
            { title: "How to Return", content: ["1. Contact us at support@volt.in or 1800-VOLT-CARE with your order ID and reason for return.", "2. Our team will raise a return request and schedule a free pickup from your address.", "3. Once the product is collected and inspected (1–2 business days), your refund will be initiated.", "4. Refund will be credited to your original payment method within 5–7 business days."] },
            { title: "Damaged / Defective Products", content: ["Report any damage or defect within 48 hours of delivery with photos.", "For DOA (Dead on Arrival) products, we offer priority replacement within 48 hours.", "Damaged products are not required to be returned — our team will assess based on photos."] },
          ].map(section => (
            <div key={section.title} className={s.infoSection}>
              <h2>{section.title}</h2>
              <ul>{section.content.map(item => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 12 }}>Need help with a return? Our support team is here for you.</p>
            <Link href={`${basePath}/about`} className={`${s.btn} ${s.btnPrimary}`}>Contact Support</Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
