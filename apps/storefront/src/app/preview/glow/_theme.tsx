import type { StoreTheme } from "../../../lib/themes/types"
import { GlowLivePage, GlowLiveNav } from "./_live"
import { GlowShopLivePage } from "./_shop-live"
import { GlowDealsLivePage } from "./_deals-live"
import { GlowPdpLivePage } from "./_pdp-live"
import { GlowCartLivePage, GlowCheckoutLivePage, GlowOrderLivePage } from "./_functional-live"
import { Footer } from "./_components"

/** GlowTheme — the Glow (skincare) design as a `StoreTheme`. */
export const GlowTheme: StoreTheme = {
  Home: GlowLivePage,
  Shop: GlowShopLivePage,
  PDP: GlowPdpLivePage,
  Deals: GlowDealsLivePage,
  Nav: GlowLiveNav,
  Footer: ({ config }) => <Footer storeName={config?.store_name ?? null} />,
  Cart: GlowCartLivePage,
  Checkout: GlowCheckoutLivePage,
  Order: GlowOrderLivePage,
}
