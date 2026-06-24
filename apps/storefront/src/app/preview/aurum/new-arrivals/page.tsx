"use client"

import { PageShell, ProductCard, Reveal, GoldDivider, NewsletterSection } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

export default function NewArrivalsPage() {
  const newItems = PRODUCTS.filter(p => p.badge === "New")
  const rest = PRODUCTS.filter(p => p.badge !== "New")

  return (
    <PageShell>
      {/* Editorial hero */}
      <div className={s.editorial} style={{ minHeight: 420 }}>
        <img
          src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1400&q=85"
          alt="New Arrivals"
          className={s.editorialBg}
        />
        <div className={s.editorialOverlay} />
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1320, margin: "0 auto", padding: "100px var(--container-pad, 48px)" }}>
          <Reveal>
            <span className={s.sectionLabel}>Monsoon 2026</span>
            <h1 className={s.sectionTitle} style={{ color: "#fff", fontSize: "clamp(36px,5vw,72px)" }}>
              New Arrivals
            </h1>
            <GoldDivider />
            <p className={s.sectionSub} style={{ color: "rgba(255,255,255,0.5)" }}>
              Freshly crafted. Fully certified. Ready to become your next heirloom.
            </p>
          </Reveal>
        </div>
      </div>

      <div className={s.container}>
        <section className={s.section}>
          <Reveal>
            <div className={s.sectionHead}>
              <div>
                <span className={s.sectionLabel}>Just Arrived</span>
                <h2 className={s.sectionTitle}>Latest Pieces</h2>
              </div>
              <span style={{ fontSize: 13, color: "#a09080" }}>{newItems.length} new pieces</span>
            </div>
          </Reveal>
          <div className={s.productGrid4}>
            {newItems.map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 4) as 0|1|2|3} />)}
          </div>
        </section>

        <section className={s.sectionMd}>
          <Reveal>
            <div className={s.sectionHead}>
              <div>
                <span className={s.sectionLabel}>Also Available</span>
                <h2 className={s.sectionTitle}>More to Explore</h2>
              </div>
            </div>
          </Reveal>
          <div className={s.productGrid}>
            {rest.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 4) as 0|1|2|3} />)}
          </div>
        </section>
      </div>

      <NewsletterSection />
    </PageShell>
  )
}
