"use client"

import Link from "next/link"

import { PageShell, Reveal } from "./_components"
import { LiveProductCard, viewToVolt } from "./_live"
import type { CategoryView, ProductView } from "../../../lib/views"
import s from "./_styles.module.css"

function VoltEmpty() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text2)" }}>
      <p style={{ marginBottom: 20 }}>Nothing here yet.</p>
      <Link href="/shop" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Browse all products</Link>
    </div>
  )
}

/** Volt /categories — real Medusa categories (or tag-derived), with empty state. */
export function VoltCategoriesLivePage({ categories }: { categories: CategoryView[] }) {
  return (
    <PageShell>
      <div className={s.container} style={{ padding: "32px 24px 80px" }}>
        <div className={s.sectionHead}>
          <div>
            <span className={s.sectionLabel}>Browse</span>
            <div className={s.sectionTitle}>Shop by Category</div>
          </div>
          <Link href="/shop" className={s.viewAll}>View All →</Link>
        </div>
        {categories.length === 0 ? <VoltEmpty /> : (
          <div className={s.categoryGrid}>
            {categories.map((cat, i) => (
              <Reveal key={cat.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <Link href={cat.href} className={s.categoryCard}>
                  {cat.image ? (
                    <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", margin: "0 auto 12px" }}>
                      <img src={cat.image} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div className={s.categoryIcon}>🏷️</div>
                  )}
                  <div className={s.categoryName}>{cat.name}</div>
                  <div className={s.categoryCount}>{cat.count} product{cat.count !== 1 ? "s" : ""}</div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}

/** Volt /new-launches — newest real products, with empty state. */
export function VoltNewLaunchesLivePage({ products }: { products: ProductView[] }) {
  return (
    <PageShell>
      <div className={s.container} style={{ padding: "32px 24px 80px" }}>
        <div className={s.sectionHead}>
          <div>
            <span className={s.sectionLabel}>Just In</span>
            <div className={s.sectionTitle}>New Launches</div>
          </div>
          <Link href="/shop" className={s.viewAll}>View All →</Link>
        </div>
        {products.length === 0 ? <VoltEmpty /> : (
          <div className={s.productGrid}>
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <LiveProductCard product={viewToVolt(p, i)} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
