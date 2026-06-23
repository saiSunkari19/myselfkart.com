"use client"

import Link from "next/link"
import type { DealsProps } from "../../../lib/themes/types"
import { ThreadNav, ThreadFooter, ThreadProductCard, threadColorVars } from "./_live"
import s from "./_styles.module.css"

/** Thread deals slot — real sale products; honest empty state when none. */
export function ThreadDealsLivePage({ config, cartCount, deals }: DealsProps) {
  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={deals.length > 0} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.pageTitle}>
            <div className={s.pageTitleLabel}>Limited time</div>
            <h1 className={s.pageTitleText}>On Sale Now</h1>
            <p className={s.pageTitleSub}>Last-season pieces at honest prices.</p>
          </div>

          {deals.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>🏷️</div>
              <h2 className={s.emptyTitle}>No active offers right now</h2>
              <p className={s.emptyText}>Check back soon — or browse the full collection.</p>
              <Link href="/shop" className={s.btn}>Shop All</Link>
            </div>
          ) : (
            <div className={s.productGrid}>
              {deals.map((p, i) => <ThreadProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
      <ThreadFooter config={config} hasDeals={deals.length > 0} />
    </div>
  )
}
