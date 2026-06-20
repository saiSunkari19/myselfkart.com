import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function ShippingPage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Delivery</div>
          <div className={s.pageHeaderTitle}>Shipping Policy</div>
          <div className={s.pageHeaderSub}>Fast, safe, and trackable delivery across India</div>
        </div>
      </div>
      <div className={s.container}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, padding: "40px 0" }}>
          {[{ icon: "🚀", title: "Same-Day Dispatch", text: "Orders placed before 3 PM are dispatched the same day, Monday to Saturday." }, { icon: "🔒", title: "Insured Shipping", text: "All orders are insured for their full value during transit." }, { icon: "📦", title: "Premium Packaging", text: "Products are packed in tamper-evident, cushioned packaging." }].map(item => (
            <div key={item.title} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px", borderTop: "3px solid var(--accent)" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{item.text}</div>
            </div>
          ))}
        </div>
        <div className={s.infoContent} style={{ paddingTop: 0 }}>
          {[
            { title: "Shipping Rates", content: ["Free standard shipping on all orders above ₹999.", "₹99 shipping charge for orders below ₹999.", "Express same-day/next-day delivery available in Mumbai, Delhi, Bangalore, Chennai, Hyderabad, and Pune for ₹299.", "High-value orders above ₹50,000 are shipped via specialised secure courier at no extra charge."] },
            { title: "Delivery Timelines", content: ["Standard delivery: 2–4 business days pan-India.", "Metro cities: 1–2 business days for standard delivery.", "Express delivery: Same-day for orders before 1 PM; next-day for orders before 4 PM (select cities).", "Remote areas (J&K, Northeast, Andaman & Nicobar): 5–8 business days."] },
            { title: "Order Tracking", content: ["You'll receive an SMS and email with a tracking link as soon as your order is dispatched.", "Real-time tracking is available via the courier's website/app.", "Our customer support team can also provide tracking updates — call 1800-VOLT-CARE."] },
            { title: "Failed Delivery", content: ["Our courier partner will attempt delivery up to 3 times.", "After 3 failed attempts, the order is returned to our warehouse and a full refund is issued.", "Please ensure someone is available at the delivery address and that the address and PIN code are correct."] },
          ].map(section => (
            <div key={section.title} className={s.infoSection}>
              <h2>{section.title}</h2>
              <ul>{section.content.map(item => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
