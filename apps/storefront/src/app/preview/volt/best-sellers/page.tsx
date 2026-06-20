import { PageShell, ProductCard, Reveal } from "../_components"
import { BESTSELLERS, PRODUCTS } from "../_data"
import s from "../_styles.module.css"

export default function BestSellersPage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Most Popular</div>
          <div className={s.pageHeaderTitle}>Best Sellers</div>
          <div className={s.pageHeaderSub}>Our highest-rated and most purchased products — trusted by millions of customers</div>
        </div>
      </div>
      <div className={s.container}>
        <section className={s.section}>
          <Reveal>
            <div className={s.sectionHead}>
              <div className={s.sectionTitle}>🏆 Top Picks</div>
            </div>
          </Reveal>
          <div className={s.productGrid}>
            {BESTSELLERS.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
        <section className={s.section} style={{ borderTop: "1px solid var(--border)" }}>
          <Reveal><div className={s.sectionTitle} style={{ marginBottom: 24 }}>⭐ Highly Rated</div></Reveal>
          <div className={s.productGrid}>
            {PRODUCTS.filter(p => p.rating >= 4.6).slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
