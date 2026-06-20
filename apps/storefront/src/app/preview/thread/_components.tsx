"use client"

import Link from "next/link"
import { type Product } from "./_data"
import s from "./_styles.module.css"

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export const NavBar = () => (
  <>
    <div className={s.announcementBar}>
      <strong>Free shipping</strong> on orders above ₹2,999 &nbsp;·&nbsp; Use code <strong>THREAD10</strong> for 10% off
    </div>
    <nav className={s.nav}>
      <div className={s.navInner}>
        <div className={s.navActions} style={{ justifyContent: "flex-start" }}>
          {[
            { label: "Shop", href: "/preview/thread/products" },
            { label: "Categories", href: "/preview/thread/categories" },
          ].map(item => (
            <Link key={item.label} href={item.href} className={s.navLink}>{item.label}</Link>
          ))}
        </div>

        <Link href="/preview/thread" className={s.navLogo}>Thread</Link>

        <div className={s.navActions}>
          <Link href="/preview/thread/about" className={s.navIconBtn}>About</Link>
          <Link href="/preview/thread/contact" className={s.navIconBtn}>Contact</Link>
          <Link href="/preview/thread/cart" className={s.navIconBtn}>
            Bag <span className={s.cartBadge}>2</span>
          </Link>
        </div>
      </div>
    </nav>
  </>
)

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const Footer = () => (
  <footer className={s.footer}>
    <div className={s.footerInner}>
      <div className={s.footerTop}>
        <div className={s.footerBrand}>
          <Link href="/preview/thread" className={s.footerLogo}>Thread</Link>
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
              { label: "All Products", href: "/preview/thread/products" },
              { label: "Tops", href: "/preview/thread/categories" },
              { label: "Bottoms", href: "/preview/thread/categories" },
              { label: "Dresses", href: "/preview/thread/categories" },
              { label: "Outerwear", href: "/preview/thread/categories" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About Us", href: "/preview/thread/about" },
              { label: "Contact", href: "/preview/thread/contact" },
              { label: "FAQ", href: "/preview/thread/faq" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Privacy Policy", href: "/preview/thread/privacy" },
              { label: "Terms of Service", href: "/preview/thread/terms" },
              { label: "Return Policy", href: "/preview/thread/faq" },
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
        <span className={s.footerCopy}>© 2026 Thread. All rights reserved.</span>
        <span className={s.footerTemplateBadge}>Template Preview</span>
      </div>
    </div>
  </footer>
)

// ---------------------------------------------------------------------------
// ProductCard
// ---------------------------------------------------------------------------

export const ProductCard = ({ product }: { product: Product }) => (
  <Link href={`/preview/thread/products/${product.id}`} className={s.productCard}>
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

// ---------------------------------------------------------------------------
// PageShell
// ---------------------------------------------------------------------------

export const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className={s.page}>
    <NavBar />
    <div className={s.pageShell}>{children}</div>
    <Footer />
  </div>
)

// ---------------------------------------------------------------------------
// Newsletter (reusable section)
// ---------------------------------------------------------------------------

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
