import type { StoreTheme } from "../../../lib/themes/types"
import { VoltLivePage, VoltNav } from "./_live"
import { VoltShopLivePage } from "./_shop-live"
import { VoltDealsLivePage } from "./_deals-live"
import { VoltPdpLivePage } from "./_pdp-live"
import { VoltCartLivePage, VoltCheckoutLivePage, VoltOrderLivePage } from "./_functional-live"
import { Footer } from "./_components"

/**
 * VoltTheme — the Volt design as a `StoreTheme`. Every slot is Volt-themed:
 * catalog/browse (Home, Shop, PDP, Deals) and the functional flow (Cart,
 * Checkout, Order) which wraps the shared functional components in Volt chrome.
 */
export const VoltTheme: StoreTheme = {
  Home: VoltLivePage,
  Shop: VoltShopLivePage,
  PDP: VoltPdpLivePage,
  Deals: VoltDealsLivePage,
  Nav: VoltNav,
  Footer: () => <Footer />,
  Cart: VoltCartLivePage,
  Checkout: VoltCheckoutLivePage,
  Order: VoltOrderLivePage,
}
