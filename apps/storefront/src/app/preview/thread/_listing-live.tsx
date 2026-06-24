"use client"

import Link from "next/link"

import { PageShell } from "./_components"
import type { CategoryView } from "../../../lib/views"
import s from "./_styles.module.css"

/** Thread /categories — real Medusa categories (or tag-derived), with empty state. */
export function ThreadCategoriesLivePage({ categories }: { categories: CategoryView[] }) {
  return (
    <PageShell>
      <div className={s.container} style={{ padding: "48px 0 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 className={s.sectionTitle} style={{ marginBottom: 16 }}>Shop by Category</h2>
          <p className={`${s.sectionSub} ${s.sectionSubCenter}`} style={{ marginBottom: 0 }}>
            Find exactly what you&apos;re looking for, or discover something new.
          </p>
        </div>
        {categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#a09890" }}>
            <p style={{ marginBottom: 20 }}>No categories yet.</p>
            <Link href="/shop" className={s.btn}>Browse all products</Link>
          </div>
        ) : (
          <div className={s.categoryGrid}>
            {categories.map(cat => (
              <Link key={cat.id} href={cat.href} className={s.categoryCard}>
                <img
                  src={cat.image ?? `https://placehold.co/600x750/png?text=${encodeURIComponent(cat.name)}`}
                  alt={cat.name}
                />
                <div className={s.categoryOverlay} />
                <div className={s.categoryInfo}>
                  <div className={s.categoryName}>{cat.name}</div>
                  <div className={s.categoryCount}>{cat.count} style{cat.count !== 1 ? "s" : ""}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
