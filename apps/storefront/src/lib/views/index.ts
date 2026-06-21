/**
 * Theme-agnostic view models — the single seam between Medusa and themes.
 *
 * Routes map Medusa data into these shapes once; every theme renders from them.
 * Themes must never import from `lib/medusa/*` directly — only from here.
 */
export type { ProductView } from "./product"
export { mapProduct, mapProducts } from "./product"

// The raw sellable variant shape, surfaced for add-to-cart controls. Themes
// pass this straight to <AddToCart>; it is data, not a Medusa dependency.
export type { StoreVariant as VariantView } from "../medusa/products"

export type { CategoryView } from "./category"
export {
  deriveCategoriesFromTags,
  resolveCategories,
  filterByCategory,
} from "./category"

// Cart / checkout / order shapes are already view-friendly; alias them here so
// themes depend on the views barrel, not on the Medusa data layer. Phase 2
// formalises these as dedicated view models if they need to diverge.
export type {
  Cart as CartView,
  CartLineItem as CartLineItemView,
  CartAddress as CartAddressView,
  ShippingOption as ShippingOptionView,
} from "../medusa/cart"

export type { StoreOrder as OrderView } from "../medusa/order"
