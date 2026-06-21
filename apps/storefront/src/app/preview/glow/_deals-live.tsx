"use client"

import Link from "next/link"
import { PageLoader, Footer, GoldDivider, Reveal } from "./_components"
import { GlowLiveNav, GlowLiveProductCard } from "./_live"
import type { DealsProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/** Glow "Offers" slot — real sale-priced products, honest empty state. */
export function GlowDealsLivePage({ config, deals }: DealsProps) {
  const storeName = config?.store_name ?? "glow."
  const hasDeals = deals.length > 0

  return (
    <div className={s.page}>
      <PageLoader />
      <GlowLiveNav config={config} hasDeals={hasDeals} categories={[]} />
      <div className={s.headerSpacer} />
      <section className={s.section}>
        <div className={s.container}>
          <Reveal>
            <div className={s.sectionCenter}>
              <span className={s.sectionLabel}>Limited Time</span>
              <h2 className={s.sectionTitle}>Offers &amp; Sets</h2>
              <GoldDivider />
            </div>
          </Reveal>
          {hasDeals ? (
            <div className={s.productsGrid}>
              {deals.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}><GlowLiveProductCard product={p} index={i} /></Reveal>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p className={s.sectionSub}>No active offers right now — explore the full collection instead.</p>
              <Link href="/" className={`${s.btn} ${s.btnDark}`} style={{ marginTop: 16 }}>Shop {storeName}</Link>
            </div>
          )}
        </div>
      </section>
      <Footer storeName={storeName} />
    </div>
  )
}
