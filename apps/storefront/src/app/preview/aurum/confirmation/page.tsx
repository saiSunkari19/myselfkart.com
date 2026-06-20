"use client"

import Link from "next/link"
import { PageShell, GoldDivider } from "../_components"
import s from "../_styles.module.css"

export default function ConfirmationPage() {
  const orderId = "AUR-" + Math.floor(100000 + Math.random() * 900000)

  return (
    <PageShell>
      <div className={s.container}>
        <div style={{ textAlign: "center", padding: "80px 0 60px", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>✦</div>
          <div className={s.pageHeaderLabel}>Order Confirmed</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px,4vw,40px)", fontWeight: 400, color: "#1a1410", margin: "12px 0 8px" }}>
            Thank you for your order
          </h1>
          <GoldDivider />
          <p style={{ color: "#6b5f52", fontSize: 15, lineHeight: 1.8, margin: "20px 0 32px" }}>
            Your order has been placed successfully. We will send you a confirmation email shortly with your order details and tracking information.
          </p>
          <div style={{ background: "#fdf9f4", border: "1.5px solid #e8e0d4", padding: "28px 32px", marginBottom: 40, borderTop: "3px solid #b8962e" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#a09080", marginBottom: 8 }}>Order Reference</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#b8962e", letterSpacing: 2, fontFamily: "Georgia, serif" }}>{orderId}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 48 }}>
            {[
              { icon: "📦", title: "Insured Packaging", text: "Your jewellery will be packed in our signature luxury box" },
              { icon: "🚚", title: "3–5 Business Days", text: "Real-time tracking will be shared via email and SMS" },
              { icon: "💎", title: "Certificate Included", text: "All authenticity certificates ship with your order" },
            ].map(item => (
              <div key={item.title} style={{ textAlign: "center", padding: "20px 12px", background: "#fdf9f4" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#1a1410", marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#6b5f52", lineHeight: 1.6 }}>{item.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/preview/aurum/shop" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>Continue Shopping</Link>
            <Link href="/preview/aurum" className={`${s.btn} ${s.btnOutline} ${s.btnLg}`}>Back to Home</Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
