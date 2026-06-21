import type { StoreTheme } from "../../../lib/themes/types"
import { ThreadLivePage, ThreadNav, ThreadFooter } from "./_live"
import { ThreadShopLivePage } from "./_shop-live"
import { ThreadPdpLivePage } from "./_pdp-live"
import { ThreadDealsLivePage } from "./_deals-live"
import { ThreadCartLivePage, ThreadCheckoutLivePage, ThreadOrderLivePage } from "./_functional-live"
import { ThreadLoginPage, ThreadAccountPage } from "./_account-live"

/**
 * ThreadTheme — the Thread (apparel) design as a `StoreTheme`. Every slot is
 * Thread-themed: catalog/browse (Home, Shop, PDP, Deals) and the functional flow
 * (Cart, Checkout, Order) wrapping the real server actions in Thread chrome.
 */
export const ThreadTheme: StoreTheme = {
  Home: ThreadLivePage,
  Shop: ThreadShopLivePage,
  PDP: ThreadPdpLivePage,
  Deals: ThreadDealsLivePage,
  Nav: ThreadNav,
  Footer: ThreadFooter,
  Cart: ThreadCartLivePage,
  Checkout: ThreadCheckoutLivePage,
  Order: ThreadOrderLivePage,
  Login: ThreadLoginPage,
  Account: ThreadAccountPage,
}
