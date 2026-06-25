import type { ReactNode } from "react"

import type { StoreConfig } from "../store-config"
import type {
  ProductView,
  CategoryView,
  CartView,
  ShippingOptionView,
  VariantView,
  OrderView,
  CustomerView,
  CustomerAddressView,
  CustomerOrderListItem,
  ProductFilters,
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
  /** Total item quantity in the visitor's cart, for the nav's bag/cart badge. */
  cartCount?: number
}

export type HomeProps = ThemeContext & {
  products: ProductView[]
  /** Derived category taxonomy nav (empty → themes hide the category section). */
  categories: CategoryView[]
  /**
   * Seller-curated Medusa collections, a DISTINCT group from `categories`
   * (empty → themes hide the collection section). Same shape so themes render
   * them in their own "Shop by Collection" slot; `?category=<id>` filters either.
   */
  collections: CategoryView[]
  /** Products on an active sale (empty → themes hide the deals section). */
  deals: ProductView[]
  /** Newest-first products for "new arrivals". */
  newArrivals: ProductView[]
}

export type ShopProps = ThemeContext & {
  /** Products for the current page only. */
  products: ProductView[]
  categories: CategoryView[]
  /** Seller-curated collections, distinct from `categories` (see HomeProps). */
  collections: CategoryView[]
  /** Currently selected category id, or null for "All". */
  activeCategory: string | null
  /** Current page number, 1-indexed. */
  page: number
  /** Total number of pages for the current filter/search. */
  totalPages: number
  /** Total matching products across all pages, for the "N products" count display. */
  totalCount: number
  /** Currently active facet filter selections (price/availability/rating/sale/color/size). */
  filters: ProductFilters
  /** Distinct color/size values available across the current category's products, for sidebar options. */
  facets: { colors: string[]; sizes: string[] }
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
  /** The signed-in buyer (checkout is gated, so normally present). */
  customer?: CustomerView | null
  /** Saved addresses to offer as a picker above the address form. */
  savedAddresses?: CustomerAddressView[]
}

export type LoginProps = ThemeContext & {
  /** Same-origin path to return to after a successful sign-in. */
  next: string
  /** Error surfaced from a failed OAuth round-trip (?error=). */
  error?: string | null
  /** Notice surfaced after e.g. a successful password reset (?reset=1). */
  notice?: string | null
}

export type AccountSection = "overview" | "orders" | "addresses"

export type AccountProps = ThemeContext & {
  customer: CustomerView
  section: AccountSection
  orders: CustomerOrderListItem[]
  addresses: CustomerAddressView[]
  countries: { iso_2: string; display_name?: string | null }[]
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
  /** Sign in / register / forgot-password entry. */
  Login(p: LoginProps): ReactNode
  /** Account dashboard — overview / orders / addresses (driven by `section`). */
  Account(p: AccountProps): ReactNode
  Nav(p: NavProps): ReactNode
  Footer(p: FooterProps): ReactNode
}
