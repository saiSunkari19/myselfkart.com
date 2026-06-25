"use client"

import Link from "next/link"

import { PageShell, GoldDivider } from "./_components"
import { AurumProductCard } from "./_live"
import type { ProductView } from "../../../lib/views"
import s from "./_styles.module.css"

/** Aurum /new-arrivals — newest real products, with empty state. */
export function AurumNewArrivalsLivePage({ products }: { products: ProductView[] }) {
  return (
    <PageShell>
      <div className={s.pageHeader} style={{ padding: "100px 0 60px" }}>
        <div className={s.pageHeaderLabel}>Just Arrived</div>
        <h1 className={s.pageHeaderTitle}>New Arrivals</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>The latest additions to the atelier.</p>
      </div>
      <div className={s.container} style={{ paddingBottom: 80 }}>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0 100px", color: "#6b5f52" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>◇</div>
            <p style={{ fontSize: 15, marginBottom: 24 }}>No new arrivals yet.</p>
            <Link href="/shop" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>Browse all products</Link>
          </div>
        ) : (
          <div className={s.productGrid4}>
            {products.map((p, i) => <AurumProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </PageShell>
  )
}
