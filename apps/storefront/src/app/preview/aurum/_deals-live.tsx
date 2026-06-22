"use client"

import Link from "next/link"
import type { DealsProps } from "../../../lib/themes/types"
import { AurumNav, AurumFooter, AurumProductCard, aurumColorVars } from "./_live"
import s from "./_styles.module.css"

/** Aurum deals slot — real sale products; honest empty state when none. */
export function AurumDealsLivePage({ config, cartCount, deals }: DealsProps) {
  const hasDeals = deals.length > 0
  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} cartCount={cartCount} hasDeals={hasDeals} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.pageHeader}>
            <div className={s.pageHeaderLabel}>Limited Time</div>
            <h1 className={s.pageHeaderTitle}>Special Offers</h1>
            <p className={s.pageHeaderSub}>Exceptional pieces at exceptional value.</p>
          </div>

          {!hasDeals ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>✦</div>
              <div className={s.emptyTitle}>No active offers right now</div>
              <p className={s.emptyText}>Check back soon — or explore the full collection.</p>
              <Link href="/shop" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>Shop All</Link>
            </div>
          ) : (
            <div className={s.productGrid}>
              {deals.map((p, i) => <AurumProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
      <AurumFooter config={config} hasDeals={hasDeals} />
    </div>
  )
}
