"use client"

import Link from "next/link"
import type { ShopProps } from "../../../lib/themes/types"
import { ThreadNav, ThreadFooter, ThreadProductCard, threadColorVars } from "./_live"
import { Pagination } from "../../../components/pagination"
import { PRICE_BUCKETS, RATING_OPTIONS, buildShopFilterHref } from "../../../lib/views"
import s from "./_styles.module.css"

const DEFAULT_ENABLED_FILTERS = ["category", "price", "availability"]

/** Thread shop/listing slot — real products + real category/facet filters (live routes). */
export function ThreadShopLivePage({
  config,
  cartCount,
  products,
  categories,
  collections,
  activeCategory,
  page,
  totalPages,
  totalCount,
  filters,
  facets,
}: ShopProps) {
  const enabled = new Set(config?.filter_config?.enabled ?? DEFAULT_ENABLED_FILTERS)
  const isEnabled = (key: string) => enabled.has(key)
  const href = (patch: Parameters<typeof buildShopFilterHref>[2]) =>
    buildShopFilterHref(activeCategory, filters, patch)

  const showAvailability = isEnabled("availability")
  const showPrice = isEnabled("price")
  const showRating = isEnabled("rating")
  const showDiscount = isEnabled("discount")
  const showColor = isEnabled("color") && facets.colors.length > 0
  const showSize = isEnabled("size") && facets.sizes.length > 0
  const hasSidebar =
    collections.length > 0 ||
    categories.length > 0 ||
    showAvailability ||
    showPrice ||
    showRating ||
    showDiscount ||
    showColor ||
    showSize

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
            {hasSidebar && (
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

                {showAvailability && (
                  <div className={s.filterGroup}>
                    <div className={s.filterTitle}>Availability</div>
                    <ul className={s.filterList}>
                      <li className={`${s.filterItem} ${filters.inStock ? s.active : ""}`}>
                        <Link href={href({ inStock: !filters.inStock })} style={{ color: "inherit", textDecoration: "none", flex: 1 }}>
                          In stock only
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}

                {showPrice && (
                  <div className={s.filterGroup}>
                    <div className={s.filterTitle}>Price</div>
                    <ul className={s.filterList}>
                      {PRICE_BUCKETS.map(bucket => (
                        <li key={bucket.id} className={`${s.filterItem} ${filters.priceBucket === bucket.id ? s.active : ""}`}>
                          <Link
                            href={href({ priceBucket: filters.priceBucket === bucket.id ? null : bucket.id })}
                            style={{ color: "inherit", textDecoration: "none", flex: 1 }}
                          >
                            {bucket.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showRating && (
                  <div className={s.filterGroup}>
                    <div className={s.filterTitle}>Rating</div>
                    <ul className={s.filterList}>
                      {RATING_OPTIONS.map(stars => (
                        <li key={stars} className={`${s.filterItem} ${filters.minRating === stars ? s.active : ""}`}>
                          <Link
                            href={href({ minRating: filters.minRating === stars ? null : stars })}
                            style={{ color: "inherit", textDecoration: "none", flex: 1 }}
                          >
                            {stars}★ & up
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showDiscount && (
                  <div className={s.filterGroup}>
                    <div className={s.filterTitle}>Offers</div>
                    <ul className={s.filterList}>
                      <li className={`${s.filterItem} ${filters.onSale ? s.active : ""}`}>
                        <Link href={href({ onSale: !filters.onSale })} style={{ color: "inherit", textDecoration: "none", flex: 1 }}>
                          On sale
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}

                {showColor && (
                  <div className={s.filterGroup}>
                    <div className={s.filterTitle}>Color</div>
                    <ul className={s.filterList}>
                      {facets.colors.map(color => (
                        <li key={color} className={`${s.filterItem} ${filters.color === color ? s.active : ""}`}>
                          <Link
                            href={href({ color: filters.color === color ? null : color })}
                            style={{ color: "inherit", textDecoration: "none", flex: 1 }}
                          >
                            {color}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showSize && (
                  <div className={s.filterGroup}>
                    <div className={s.filterTitle}>Size</div>
                    <ul className={s.filterList}>
                      {facets.sizes.map(size => (
                        <li key={size} className={`${s.filterItem} ${filters.size === size ? s.active : ""}`}>
                          <Link
                            href={href({ size: filters.size === size ? null : size })}
                            style={{ color: "inherit", textDecoration: "none", flex: 1 }}
                          >
                            {size}
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
                <p className={s.pageTitleSub}>No products match these filters.</p>
              ) : (
                <>
                  <div className={s.productGrid}>
                    {products.map((p, i) => <ThreadProductCard key={p.id} product={p} index={i} />)}
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    buildHref={p => buildShopFilterHref(activeCategory, filters, {}, p)}
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
