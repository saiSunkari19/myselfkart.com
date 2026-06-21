"use client"

import { useTemplateConfig } from "../../../lib/template-config-context"
import Link from "next/link"
import { type Product } from "./_data"
import s from "./_styles.module.css"

export const NavBar = () => {
  const { basePath, config } = useTemplateConfig()
  const storeName = config?.store_name ?? "Thread"
  return (
    <>
      <div className={s.announcementBar}>
        <strong>Free shipping</strong> on orders above ₹2,999 &nbsp;·&nbsp; Use code <strong>THREAD10</strong> for 10% off
      </div>
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.navActions} style={{ justifyContent: "flex-start" }}>
            {[
              { label: "Shop", href: `${basePath}/products` },
              { label: "Categories", href: `${basePath}/categories` },
            ].map(item => (
              <Link key={item.label} href={item.href} className={s.navLink}>{item.label}</Link>
            ))}
          </div>

          <Link href={basePath || "/"} className={s.navLogo}>{storeName}</Link>

          <div className={s.navActions}>
            <Link href={`${basePath}/about`} className={s.navIconBtn}>About</Link>
            <Link href={`${basePath}/contact`} className={s.navIconBtn}>Contact</Link>
            <Link href={`${basePath}/cart`} className={s.navIconBtn}>
              Bag <span className={s.cartBadge}>2</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export const Footer = () => {
  const { basePath, config } = useTemplateConfig()
  const storeName = config?.store_name ?? "Thread"
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div className={s.footerTop}>
          <div className={s.footerBrand}>
            <Link href={basePath || "/"} className={s.footerLogo}>{storeName}</Link>
            <p className={s.footerTagline}>Wear the minimal. Own the moment. Clothing for those who know what they want.</p>
            <div className={s.footerSocials}>
              {["IG", "PI", "TT", "YT"].map(icon => (
                <a key={icon} href="#" className={s.footerSocial}>{icon[0]}</a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Shop",
              links: [
                { label: "All Products", href: `${basePath}/products` },
                { label: "Tops", href: `${basePath}/categories` },
                { label: "Bottoms", href: `${basePath}/categories` },
                { label: "Dresses", href: `${basePath}/categories` },
                { label: "Outerwear", href: `${basePath}/categories` },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About Us", href: `${basePath}/about` },
                { label: "Contact", href: `${basePath}/contact` },
                { label: "FAQ", href: `${basePath}/faq` },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Privacy Policy", href: `${basePath}/privacy` },
                { label: "Terms of Service", href: `${basePath}/terms` },
                { label: "Return Policy", href: `${basePath}/faq` },
              ],
            },
          ].map(col => (
            <div key={col.title}>
              <div className={s.footerColTitle}>{col.title}</div>
              <ul className={s.footerLinks}>
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className={s.footerLink}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={s.footerBottom}>
          <span className={s.footerCopy}>© 2026 {storeName}. All rights reserved.</span>
          <span className={s.footerTemplateBadge}>Template Preview</span>
        </div>
      </div>
    </footer>
  )
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

export const NewsletterSection = () => (
  <div className={s.newsletter}>
    <div className={s.sectionLabel}>Stay in the loop</div>
    <h2 className={s.sectionTitle}>Early access. New arrivals.</h2>
    <p style={{ color: "#6b6560", fontSize: 15, marginBottom: 14 }}>
      New drops, restocks, and quiet sales. Only to the people who signed up first.
    </p>
    <div className={s.newsletterForm}>
      <input className={s.newsletterInput} placeholder="your@email.com" type="email" />
      <button className={s.newsletterBtn}>Subscribe</button>
    </div>
  </div>
)
