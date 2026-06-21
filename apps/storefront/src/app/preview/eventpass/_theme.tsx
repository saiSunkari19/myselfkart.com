import type { StoreTheme } from "../../../lib/themes/types"
import { EventpassLivePage, EventpassNav, EventpassFooter } from "./_live"
import { EventpassShopLivePage } from "./_shop-live"
import { EventpassPdpLivePage } from "./_pdp-live"
import { EventpassDealsLivePage } from "./_deals-live"
import { EventpassCartLivePage, EventpassCheckoutLivePage, EventpassOrderLivePage } from "./_functional-live"
import { EventpassLoginPage, EventpassAccountPage } from "./_account-live"

/**
 * EventpassTheme — the Eventpass (events vertical) design as a `StoreTheme`.
 * Every slot is Eventpass-themed: discovery (Home, Shop, PDP, Deals) maps real
 * products to "events/tickets", and the functional flow (Cart, Checkout, Order)
 * wraps the real server actions in Eventpass chrome with "e-tickets" framing.
 */
export const EventpassTheme: StoreTheme = {
  Home: EventpassLivePage,
  Shop: EventpassShopLivePage,
  PDP: EventpassPdpLivePage,
  Deals: EventpassDealsLivePage,
  Nav: EventpassNav,
  Footer: EventpassFooter,
  Cart: EventpassCartLivePage,
  Checkout: EventpassCheckoutLivePage,
  Order: EventpassOrderLivePage,
  Login: EventpassLoginPage,
  Account: EventpassAccountPage,
}
