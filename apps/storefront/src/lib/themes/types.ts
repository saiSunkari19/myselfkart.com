import type { ReactNode } from "react"

import type { StoreConfig } from "../store-config"
import type {
  ProductView,
  CategoryView,
  CartView,
  ShippingOptionView,
  VariantView,
  OrderView,
} from "../views"

/**
 * The theme contract. Every storefront design implements `StoreTheme`; routes
 * resolve the tenant, fetch real Medusa data, map it to view models, and hand
 * those to `getTheme(template_id).<Slot>`. Themes are PURE PRESENTATION — props
 * in, JSX out. They never fetch data or import `lib/medusa/*`.
 *
 * Adding a page = add a slot here; the compiler then forces every theme to
 * implement it. See docs/THEMES_PLAYBOOK.md §5.
 */

/** Common context every slot receives. */
export type ThemeContext = {
  /** Seller's store config (name, colours, fonts, hero, announcement…). */
  config: StoreConfig | null
}

export type HomeProps = ThemeContext & {
  products: ProductView[]
  /** Derived category nav (empty → themes hide the category section). */
  categories: CategoryView[]
  /** Products on an active sale (empty → themes hide the deals section). */
  deals: ProductView[]
  /** Newest-first products for "new arrivals". */
  newArrivals: ProductView[]
}

export type ShopProps = ThemeContext & {
  products: ProductView[]
  categories: CategoryView[]
  /** Currently selected category id, or null for "All". */
  activeCategory: string | null
}

export type PdpProps = ThemeContext & {
  product: ProductView
  /** Raw sellable variants for the add-to-cart control. */
  variants: VariantView[]
  related: ProductView[]
}

export type DealsProps = ThemeContext & {
  deals: ProductView[]
}

export type CartProps = ThemeContext & {
  cart: CartView | null
}

export type CheckoutProps = ThemeContext & {
  cart: CartView | null
  shippingOptions: ShippingOptionView[]
  countries: { iso_2: string; display_name?: string | null }[]
  hasRazorpay: boolean
  error?: string | null
}

export type OrderProps = ThemeContext & {
  order: OrderView
}

export type NavProps = ThemeContext & {
  /** Whether to surface the Deals link (true only when real deals exist). */
  hasDeals: boolean
  categories: CategoryView[]
}

export type FooterProps = ThemeContext

export interface StoreTheme {
  Home(p: HomeProps): ReactNode
  Shop(p: ShopProps): ReactNode
  PDP(p: PdpProps): ReactNode
  Deals(p: DealsProps): ReactNode
  Cart(p: CartProps): ReactNode
  Checkout(p: CheckoutProps): ReactNode
  Order(p: OrderProps): ReactNode
  Nav(p: NavProps): ReactNode
  Footer(p: FooterProps): ReactNode
}
