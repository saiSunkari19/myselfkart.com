import Link from "next/link"
import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function ConfirmationPage() {
  const orderId = "VLT" + Math.floor(10000000 + Math.random() * 90000000)
  return (
    <PageShell>
      <div className={s.container}>
        <div style={{ textAlign: "center", padding: "80px 0 60px", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Order Confirmed!</h1>
          <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 28 }}>Thank you for your order. We'll send you a shipping confirmation shortly.</p>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 28px", marginBottom: 36, borderTop: "3px solid var(--accent)" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--text3)", marginBottom: 6 }}>Order ID</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: 1 }}>{orderId}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 36 }}>
            {[{ icon: "📦", title: "Packed Same Day", text: "Your order is being picked and packed" }, { icon: "🚚", title: "Delivery in 2–3 days", text: "Tracked and insured shipping" }, { icon: "📱", title: "Track via SMS", text: "You'll receive tracking updates on your phone" }].map(item => (
              <div key={item.title} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--text3)" }}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/preview/volt/shop" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Continue Shopping</Link>
            <Link href="/preview/volt" className={`${s.btn} ${s.btnSecondary} ${s.btnLg}`}>Back to Home</Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
