import Link from "next/link"

import { AddToCart } from "../../components/add-to-cart"
import { CartContents } from "../../components/storefront/cart-contents"
import { CheckoutFlow } from "../../components/storefront/checkout-flow"
import { OrderSummary } from "../../components/storefront/order-summary"
import { LoginForm } from "../../components/storefront/account/login-form"
import { AccountContent } from "../../components/storefront/account/account-content"
import { formatMoney } from "../format"
import type { ProductView } from "../views"
import type {
  StoreTheme,
  HomeProps,
  ShopProps,
  PdpProps,
  DealsProps,
  CartProps,
  CheckoutProps,
  OrderProps,
  LoginProps,
  AccountProps,
  NavProps,
  FooterProps,
} from "./types"

/**
 * DefaultTheme — clean, unopinionated semantic markup used when a tenant has no
 * `template_id` (e.g. flyr) and as the safety fallback in `getTheme()`. It is
 * the reference implementation of the full `StoreTheme` contract: every other
 * theme can mirror this slot-for-slot.
 */

function priceLabel(p: ProductView): string | null {
  if (p.price == null) return null
  return formatMoney(p.price, p.currencyCode ?? "INR")
}

function ProductGrid({ products }: { products: ProductView[] }) {
  if (products.length === 0) return <p className="state">No products are available yet.</p>
  return (
    <ul className="product-grid">
      {products.map(p => (
        <li key={p.id} className="product-card">
          <Link href={p.href}>
            {p.thumbnail ? <img src={p.thumbnail} alt={p.title} /> : null}
            <strong>{p.title}</strong>
            {priceLabel(p) ? <span className="price">{priceLabel(p)}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Nav({ config, hasDeals }: NavProps) {
  const storeName = config?.store_name ?? "Store"
  return (
    <header className="site-header">
      <Link href="/">{storeName}</Link>
      <nav style={{ display: "flex", gap: "1rem" }}>
        <Link href="/shop">Shop</Link>
        {hasDeals && <Link href="/deals">Deals</Link>}
        <Link href="/account">Account</Link>
        <Link href="/cart">Cart</Link>
      </nav>
    </header>
  )
}

function Footer({ config }: FooterProps) {
  return (
    <footer style={{ padding: "2rem 0", textAlign: "center", opacity: 0.7 }}>
      © {config?.store_name ?? "Store"}
    </footer>
  )
}

export const DefaultTheme: StoreTheme = {
  Nav,
  Footer,

  Home({ products }: HomeProps) {
    return (
      <main>
        <h2>Products</h2>
        <ProductGrid products={products} />
      </main>
    )
  },

  Shop({ products, categories, activeCategory }: ShopProps) {
    return (
      <main>
        {categories.length > 0 && (
          <nav style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <Link href="/shop" style={{ fontWeight: activeCategory ? 400 : 700 }}>All</Link>
            {categories.map(c => (
              <Link key={c.id} href={c.href} style={{ fontWeight: activeCategory === c.id ? 700 : 400 }}>
                {c.name} ({c.count})
              </Link>
            ))}
          </nav>
        )}
        <ProductGrid products={products} />
      </main>
    )
  },

  PDP({ product, variants }: PdpProps) {
    return (
      <main>
        <p><Link href="/">← Back to shop</Link></p>
        {product.thumbnail ? (
          <img src={product.thumbnail} alt={product.title} style={{ maxWidth: 320, borderRadius: 10 }} />
        ) : null}
        <h1>{product.title}</h1>
        {product.description ? <p>{product.description}</p> : null}
        <AddToCart variants={variants} />
      </main>
    )
  },

  Deals({ deals }: DealsProps) {
    return (
      <main>
        <h1>Deals &amp; Offers</h1>
        {deals.length === 0
          ? <p className="state">No active offers right now. <Link href="/">Shop all products</Link>.</p>
          : <ProductGrid products={deals} />}
      </main>
    )
  },

  Cart({ cart }: CartProps) {
    return <main><CartContents cart={cart} /></main>
  },

  Checkout({ cart, shippingOptions, countries, hasRazorpay, error, savedAddresses, customer }: CheckoutProps) {
    return (
      <main>
        <CheckoutFlow
          cart={cart}
          shippingOptions={shippingOptions}
          countries={countries}
          hasRazorpay={hasRazorpay}
          error={error}
          savedAddresses={savedAddresses}
          customerEmail={customer?.email}
        />
      </main>
    )
  },

  Order({ order }: OrderProps) {
    return <main><OrderSummary order={order} /></main>
  },

  Login({ config, next, error, notice }: LoginProps) {
    return (
      <main style={{ padding: "48px 0" }}>
        <LoginForm next={next} error={error} notice={notice} accent={config?.accent_color ?? undefined} />
      </main>
    )
  },

  Account(props: AccountProps) {
    return (
      <main style={{ padding: "32px 0" }}>
        <AccountContent {...props} accent={props.config?.accent_color ?? undefined} />
      </main>
    )
  },
}
