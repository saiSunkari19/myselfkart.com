"use client"

import Link from "next/link"

import { PageShell, GoldDivider, Reveal } from "./_components"
import type { CategoryView } from "../../../lib/views"
import s from "./_styles.module.css"

/**
 * Aurum /collections fed REAL Medusa collections (resolveCollections). No mock
 * data — when the seller has published no collections it shows a clean empty
 * state instead of demo "Bridal/Heritage" cards.
 */
export function AurumCollectionsLivePage({ collections }: { collections: CategoryView[] }) {
  return (
    <PageShell>
      <div className={s.pageHeader} style={{ padding: "100px 0 80px" }}>
        <div className={s.pageHeaderLabel}>Discover</div>
        <h1 className={s.pageHeaderTitle}>Our Collections</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>
          Explore our curated collections — each a distinct chapter, unified by the pursuit of perfection.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className={s.container}>
          <div style={{ textAlign: "center", padding: "20px 0 120px", color: "#6b5f52" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>◇</div>
            <p style={{ fontSize: 15, marginBottom: 24 }}>No collections have been published yet.</p>
            <Link href="/shop" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>Browse all products</Link>
          </div>
        </div>
      ) : (
        <div className={s.collectionGrid2} style={{ gap: 2 }}>
          {collections.map((col, i) => (
            <Reveal key={col.id} delay={(i % 2) as 0 | 1}>
              <Link href={col.href} className={s.collectionCard} style={{ aspectRatio: i < 2 ? "16/9" : "4/3" }}>
                {col.image ? (
                  <img src={col.image} alt={col.name} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#efe7da" }} />
                )}
                <div className={s.collectionOverlay} />
                <div className={s.collectionInfo} style={{ padding: "40px" }}>
                  <div className={s.collectionName} style={{ fontSize: 28 }}>{col.name}</div>
                  <div className={s.collectionCount}>{col.count} piece{col.count !== 1 ? "s" : ""}</div>
                  <div className={s.collectionCta}>Explore →</div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </PageShell>
  )
}
