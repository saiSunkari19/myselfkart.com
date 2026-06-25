"use client"

import Link from "next/link"
import { PageShell, ProductCard, Reveal, GoldDivider, NewsletterSection } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"
import { useTemplateConfig } from "../../../../lib/template-config-context"

const OCCASIONS = [
  { label: "Anniversary", icon: "💍", products: PRODUCTS.slice(1, 5) },
  { label: "Birthday", icon: "🎂", products: PRODUCTS.slice(4, 8) },
  { label: "Festive", icon: "✨", products: PRODUCTS.slice(0, 4) },
]

export default function GiftsPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      <section className={s.editorial} style={{ minHeight: 480 }}>
        <img
          src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1400&q=85"
          alt="Gift Collection"
          className={s.editorialBg}
        />
        <div className={s.editorialOverlay} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1320, margin: "0 auto", padding: "100px var(--container-pad, 48px)", width: "100%" }}>
          <Reveal>
            <span className={s.sectionLabel}>Gift Collection</span>
            <h1 className={s.sectionTitle} style={{ color: "#fff", fontSize: "clamp(36px,5vw,64px)" }}>
              The gift of brilliance.
            </h1>
            <GoldDivider />
            <p className={s.sectionSub} style={{ color: "rgba(255,255,255,0.5)" }}>
              For every milestone. Every celebration. Every person who deserves the extraordinary.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Gift services */}
      <section className={`${s.sectionSm} ${s.sectionCream}`}>
        <div className={s.container}>
          <div className={s.grid4} style={{ gap: 2 }}>
            {[
              { icon: "🎁", title: "Luxury Gift Box", desc: "Every order ships in our signature gift box with satin ribbon." },
              { icon: "✍️", title: "Personal Message", desc: "Add a handwritten message card — complimentary on all gifts." },
              { icon: "📦", title: "Gift Wrapping", desc: "Beautiful premium gift wrapping with gold foil accents." },
              { icon: "🚚", title: "Gift Delivery", desc: "Ship directly to the recipient. We'll keep the receipt separate." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={(i % 4) as 0|1|2|3}>
                <div style={{ background: "#fff", padding: "32px 24px", borderTop: "2px solid #b8962e" }}>
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{item.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1410", marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "#6b5f52", lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* By occasion */}
      {OCCASIONS.map(occ => (
        <section key={occ.label} className={s.section}>
          <div className={s.container}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>{occ.icon} Gifts for {occ.label}</span>
                  <h2 className={s.sectionTitle}>{occ.label} Gifts</h2>
                </div>
                <Link href={`${basePath}/shop`} className={`${s.btn} ${s.btnOutlineGold}`}>View All</Link>
              </div>
            </Reveal>
            <div className={s.productGrid4}>
              {occ.products.map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 4) as 0|1|2|3} />)}
            </div>
          </div>
        </section>
      ))}

      <NewsletterSection />
    </PageShell>
  )
}
