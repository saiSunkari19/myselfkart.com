import Link from "next/link"
import { PageShell, ProductCard, Reveal } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const DEAL_SECTIONS = [
  { label: "🔥 Today's Deals", products: PRODUCTS.filter(p => p.discount && p.discount >= 10).slice(0, 4) },
  { label: "⚡ Limited Time", products: PRODUCTS.filter(p => p.badge === "Limited" || p.badge === "Hot").slice(0, 4) },
  { label: "📦 Bundle Offers", products: PRODUCTS.slice(8, 12) },
]

export default function DealsPage() {
  return (
    <PageShell>
      <div style={{ background: "#0f172a", padding: "40px 0" }}>
        <div className={s.container}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#60a5fa", marginBottom: 8 }}>Up to 40% Off</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>Deals &amp; Offers</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>Handpicked discounts on the best electronics. Updated daily.</p>
        </div>
      </div>

      {/* Deal categories */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "#fff" }}>
        <div className={s.container}>
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {["Today's Deals", "Lightning Deals", "Festival Sale", "Clearance", "Bundle Offers"].map((label, i) => (
              <button key={label} className={`${s.categoryBarItem} ${i === 0 ? s.categoryBarItemActive : ""}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={s.container}>
        {DEAL_SECTIONS.map(section => (
          <section key={section.label} className={s.section}>
            <Reveal>
              <div className={s.sectionHead}>
                <div className={s.sectionTitle}>{section.label}</div>
                <Link href="/preview/volt/shop" className={s.viewAll}>View All →</Link>
              </div>
            </Reveal>
            <div className={s.productGrid}>
              {section.products.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}><ProductCard product={p} /></Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  )
}
