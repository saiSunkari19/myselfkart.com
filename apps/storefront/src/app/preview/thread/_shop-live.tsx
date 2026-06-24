"use client"

import Link from "next/link"
import type { ShopProps } from "../../../lib/themes/types"
import { ThreadNav, ThreadFooter, ThreadProductCard, threadColorVars } from "./_live"
import { Pagination } from "../../../components/pagination"
import s from "./_styles.module.css"

/** Thread shop/listing slot — real products + real category filter (live routes). */
export function ThreadShopLivePage({ config, cartCount, products, categories, collections, activeCategory, page, totalPages, totalCount }: ShopProps) {
  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={categories} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.pageTitle}>
            <div className={s.pageTitleLabel}>The Collection</div>
            <h1 className={s.pageTitleText}>Shop All</h1>
            <p className={s.pageTitleSub}>Natural fabrics, considered cuts, a palette that never shouts.</p>
          </div>

          <div className={s.shopLayout}>
            {(collections.length > 0 || categories.length > 0) && (
              <aside className={s.shopFilters}>
                {collections.length > 0 && (
                  <div className={s.filterGroup}>
                    <div className={s.filterTitle}>Collections</div>
                    <ul className={s.filterList}>
                      {collections.map(col => (
                        <li key={col.id} className={`${s.filterItem} ${activeCategory === col.id ? s.active : ""}`}>
                          <Link href={col.href} style={{ color: "inherit", textDecoration: "none", flex: 1, display: "flex", justifyContent: "space-between" }}>
                            <span>{col.name}</span>
                            <span className={s.filterCount}>{col.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {categories.length > 0 && (
                <div className={s.filterGroup}>
                  <div className={s.filterTitle}>Category</div>
                  <ul className={s.filterList}>
                    <li className={`${s.filterItem} ${activeCategory ? "" : s.active}`}>
                      <Link href="/shop" style={{ color: "inherit", textDecoration: "none", flex: 1 }}>All</Link>
                    </li>
                    {categories.map(cat => (
                      <li key={cat.id} className={`${s.filterItem} ${activeCategory === cat.id ? s.active : ""}`}>
                        <Link href={cat.href} style={{ color: "inherit", textDecoration: "none", flex: 1, display: "flex", justifyContent: "space-between" }}>
                          <span>{cat.name}</span>
                          <span className={s.filterCount}>{cat.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                )}
              </aside>
            )}

            <div>
              <div className={s.shopHeader}>
                <span className={s.shopCount}>{totalCount} product{totalCount !== 1 ? "s" : ""}</span>
              </div>
              {products.length === 0 ? (
                <p className={s.pageTitleSub}>No products are available yet.</p>
              ) : (
                <>
                  <div className={s.productGrid}>
                    {products.map((p, i) => <ThreadProductCard key={p.id} product={p} index={i} />)}
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
      <ThreadFooter config={config} />
    </div>
  )
}
