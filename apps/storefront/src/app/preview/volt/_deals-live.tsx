"use client"

import Link from "next/link"
import { PageLoader, Footer, Reveal } from "./_components"
import { LiveProductCard, VoltNav, viewToVolt } from "./_live"
import type { DealsProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/**
 * Volt "Deals & Offers" slot. Deals are detected in the route via real sale
 * prices (Medusa Promotions land in Phase 3); this slot renders whatever real
 * deals it is handed, with an honest empty state when there are none.
 */
export function VoltDealsLivePage({ config, deals: dealViews }: DealsProps) {
  const storeName = config?.store_name ?? "VOLT"
  const deals = dealViews.map(viewToVolt)
  const hasDeals = deals.length > 0

  const colorOverrides = {
    ...(config?.accent_color ? { "--accent": config.accent_color } : {}),
    ...(config?.primary_color ? { "--text": config.primary_color } : {}),
    ...(config?.secondary_color ? { "--bg2": config.secondary_color } : {}),
  } as React.CSSProperties

  return (
    <div className={s.pageShell} style={colorOverrides}>
      <PageLoader />
      <VoltNav config={config} hasDeals={hasDeals} categories={[]} />
      <div className={s.main}>
        <div style={{ background: "#0f172a", padding: "40px 0" }}>
          <div className={s.container}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#60a5fa", marginBottom: 8 }}>
              {storeName}
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>Deals &amp; Offers</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
              {hasDeals ? "Live discounts on selected products." : "No active offers right now — check back soon."}
            </p>
          </div>
        </div>

        <div className={s.container}>
          {hasDeals ? (
            <section className={s.section}>
              <Reveal>
                <div className={s.sectionHead}>
                  <div className={s.sectionTitle}>🔥 On Sale Now</div>
                  <Link href="/" className={s.viewAll}>Browse All →</Link>
                </div>
              </Reveal>
              <div className={s.productGrid}>
                {deals.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                    <LiveProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </section>
          ) : (
            <section className={s.section} style={{ textAlign: "center", padding: "64px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No deals running right now</div>
              <p style={{ color: "var(--text3)", marginBottom: 24 }}>
                There are no active offers at the moment. Browse the full collection instead.
              </p>
              <Link href="/" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Shop All Products</Link>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
