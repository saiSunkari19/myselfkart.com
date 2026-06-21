import type { StoreTheme } from "../../../lib/themes/types"
import { AurumLivePage, AurumNav, AurumFooter } from "./_live"
import { AurumShopLivePage } from "./_shop-live"
import { AurumPdpLivePage } from "./_pdp-live"
import { AurumDealsLivePage } from "./_deals-live"
import { AurumCartLivePage, AurumCheckoutLivePage, AurumOrderLivePage } from "./_functional-live"
import { AurumLoginPage, AurumAccountPage } from "./_account-live"

/**
 * AurumTheme — the Aurum (fine-jewellery) design as a `StoreTheme`. Every slot is
 * Aurum-themed: catalog/browse (Home, Shop, PDP, Deals) and the functional flow
 * (Cart, Checkout, Order) wrapping the real server actions in Aurum chrome.
 */
export const AurumTheme: StoreTheme = {
  Home: AurumLivePage,
  Shop: AurumShopLivePage,
  PDP: AurumPdpLivePage,
  Deals: AurumDealsLivePage,
  Nav: AurumNav,
  Footer: AurumFooter,
  Cart: AurumCartLivePage,
  Checkout: AurumCheckoutLivePage,
  Order: AurumOrderLivePage,
  Login: AurumLoginPage,
  Account: AurumAccountPage,
}
