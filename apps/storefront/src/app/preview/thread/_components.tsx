"use client"

import { useTemplateConfig } from "../../../lib/template-config-context"
import Link from "next/link"
import { type Product } from "./_data"
import { ThreadNav, ThreadFooter } from "./_live"
import s from "./_styles.module.css"

/**
 * Static info pages (About/Privacy/Terms/FAQ/Categories/Returns) render the
 * exact same Nav/Footer as the live shop/cart/PDP pages — reading real
 * cartCount/hasDeals/categories from context (populated by the live route or
 * the catch-all router) instead of a separate, drifting hardcoded nav.
 */
export const NavBar = () => {
  const { config, hasDeals, cartCount, categories } = useTemplateConfig()
  return <ThreadNav config={config} hasDeals={hasDeals} cartCount={cartCount} categories={categories} />
}

export const Footer = () => {
  const { config, hasDeals } = useTemplateConfig()
  return <ThreadFooter config={config} hasDeals={hasDeals} />
}

export const ProductCard = ({ product }: { product: Product }) => {
  const { basePath } = useTemplateConfig()
  return (
    <Link href={`${basePath}/products/${product.id}`} className={s.productCard}>
      <div className={s.productImageWrap}>
        <img src={product.image} alt={product.name} />
        {product.tag && (
          <span className={`${s.productBadge} ${product.tag === "New" ? s.badgeNew : product.tag === "Sale" ? s.badgeSale : s.badgeSoldOut}`}>
            {product.tag}
          </span>
        )}
        <div className={s.productQuickAdd}>
          <button className={s.productQuickAddBtn}>Quick Add +</button>
        </div>
      </div>
      <div className={s.productName}>{product.name}</div>
      <div className={s.productCategory}>{product.category}</div>
      <div className={s.productPriceRow}>
        <span className={`${s.productPrice} ${product.originalPrice ? s.productPriceSale : ""}`}>
          ₹{product.price.toLocaleString()}
        </span>
        {product.originalPrice && (
          <span className={s.productPriceOriginal}>₹{product.originalPrice.toLocaleString()}</span>
        )}
      </div>
    </Link>
  )
}

export const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className={s.page}>
    <NavBar />
    <div className={s.pageShell}>{children}</div>
    <Footer />
  </div>
)

