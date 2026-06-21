"use client"

import Link from "next/link"
import { PageShell, Reveal } from "../_components"
import { CATEGORIES } from "../_data"
import { useTemplateConfig } from "../../../../lib/template-config-context"
import s from "../_styles.module.css"

export default function CategoriesPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Browse</div>
          <div className={s.pageHeaderTitle}>All Categories</div>
          <div className={s.pageHeaderSub}>Explore our complete range of electronics and tech products</div>
        </div>
      </div>
      <div className={s.container}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, padding: "40px 0 64px" }}>
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={(i % 4) as 0|1|2|3}>
              <Link href={`${basePath}/shop?category=${cat.id}`} className={s.categoryCard} style={{ padding: "28px 20px", alignItems: "flex-start", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div className={s.categoryIcon}>{cat.icon}</div>
                  <div>
                    <div className={s.categoryName} style={{ fontSize: 15 }}>{cat.name}</div>
                    <div className={s.categoryCount}>{cat.count}+ products</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{cat.description}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
