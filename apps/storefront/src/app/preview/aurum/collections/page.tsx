"use client"

import Link from "next/link"
import { PageShell, ProductCard, Reveal, GoldDivider, NewsletterSection } from "../_components"
import { COLLECTIONS, PRODUCTS } from "../_data"
import s from "../_styles.module.css"
import { useTemplateConfig } from "../../../../lib/template-config-context"

export default function CollectionsPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      <div className={s.pageHeader} style={{ padding: "100px 0 80px" }}>
        <div className={s.pageHeaderLabel}>Discover</div>
        <h1 className={s.pageHeaderTitle}>Our Collections</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>
          Each collection is a chapter in the Aurum story — distinct in spirit, unified by the pursuit of perfection.
        </p>
      </div>

      {/* Full-bleed collection grid */}
      <div className={s.collectionGrid2} style={{ gap: 2 }}>
        {COLLECTIONS.map((col, i) => (
          <Reveal key={col.id} delay={(i % 2) as 0|1}>
            <Link href={`${basePath}/shop`} className={s.collectionCard} style={{ aspectRatio: i < 2 ? "16/9" : "4/3" }}>
              <img src={col.image} alt={col.name} />
              <div className={s.collectionOverlay} />
              <div className={s.collectionInfo} style={{ padding: "40px" }}>
                <div className={s.collectionTheme}>{col.theme}</div>
                <div className={s.collectionName} style={{ fontSize: 28 }}>{col.name}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "8px 0 4px", lineHeight: 1.6 }}>
                  {col.tagline}
                </div>
                <div className={s.collectionCount}>{col.count} pieces</div>
                <div className={s.collectionCta}>Explore →</div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Featured from each collection */}
      <div className={s.container}>
        {COLLECTIONS.slice(0, 3).map(col => {
          const pieces = PRODUCTS.filter(p => p.collection === col.name).slice(0, 3)
          if (pieces.length === 0) return null
          return (
            <section key={col.id} className={s.section}>
              <Reveal>
                <div className={s.sectionHead}>
                  <div>
                    <span className={s.sectionLabel}>{col.theme}</span>
                    <h2 className={s.sectionTitle}>{col.name}</h2>
                    <p className={s.sectionSub}>{col.tagline}</p>
                  </div>
                  <Link href={`${basePath}/shop`} className={`${s.btn} ${s.btnOutlineGold}`}>
                    View Collection
                  </Link>
                </div>
              </Reveal>
              <div className={s.productGrid3}>
                {pieces.map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 3) as 0|1|2} />)}
              </div>
            </section>
          )
        })}
      </div>

      <NewsletterSection />
    </PageShell>
  )
}
