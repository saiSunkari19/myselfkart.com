"use client"

import Link from "next/link"
import type { ShopProps } from "../../../lib/themes/types"
import { AurumNav, AurumFooter, AurumProductCard, aurumColorVars } from "./_live"
import { Pagination } from "../../../components/pagination"
import s from "./_styles.module.css"

/** Aurum shop/listing slot — real products + real category filter (live routes). */
export function AurumShopLivePage({ config, cartCount, products, categories, activeCategory, page, totalPages, totalCount }: ShopProps) {
  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} cartCount={cartCount} hasDeals={false} categories={categories} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.pageHeader}>
            <div className={s.pageHeaderLabel}>The Collection</div>
            <h1 className={s.pageHeaderTitle}>Shop All Jewellery</h1>
            <p className={s.pageHeaderSub}>
              {totalCount} certified piece{totalCount !== 1 ? "s" : ""} — hallmarked, verified, and ready to ship.
            </p>
          </div>

          <div className={s.shopLayout}>
            {categories.length > 0 && (
              <aside className={s.shopFilters}>
                <div className={s.filterHeading}>Filters</div>
                <div className={s.filterGroup}>
                  <div className={s.filterGroupTitle}>Category</div>
                  <ul className={s.filterList}>
                    <li className={`${s.filterItem} ${activeCategory ? "" : s.filterItemActive}`}>
                      <Link href="/shop" style={{ color: "inherit", textDecoration: "none", flex: 1 }}>All</Link>
                    </li>
                    {categories.map(cat => (
                      <li key={cat.id} className={`${s.filterItem} ${activeCategory === cat.id ? s.filterItemActive : ""}`}>
                        <Link href={cat.href} style={{ color: "inherit", textDecoration: "none", flex: 1, display: "flex", justifyContent: "space-between" }}>
                          <span>{cat.name}</span>
                          <span className={s.filterCount}>{cat.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            )}

            <div>
              <div className={s.shopHeader}>
                <span className={s.shopCount}>{totalCount} piece{totalCount !== 1 ? "s" : ""}</span>
              </div>
              {products.length === 0 ? (
                <div className={s.emptyState}>
                  <div className={s.emptyIcon}>✦</div>
                  <div className={s.emptyTitle}>No pieces available yet</div>
                  <p className={s.emptyText}>Check back soon.</p>
                </div>
              ) : (
                <>
                  <div className={s.productGrid}>
                    {products.map((p, i) => <AurumProductCard key={p.id} product={p} index={i} />)}
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    buildHref={p => `/shop?${activeCategory ? `category=${activeCategory}&` : ""}page=${p}`}
                    className={s.pageLink}
                    activeClassName={`${s.pageLink} ${s.pageLinkActive}`}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <AurumFooter config={config} />
    </div>
  )
}
