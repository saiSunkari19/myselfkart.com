"use client"

import { PageLoader, Footer } from "./_components"
import { GlowLiveNav } from "./_live"
import { CartContents } from "../../../components/storefront/cart-contents"
import { CheckoutFlow } from "../../../components/storefront/checkout-flow"
import { OrderSummary } from "../../../components/storefront/order-summary"
import type { CartProps, CheckoutProps, OrderProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/** Glow functional slots — shared cart/checkout/order wrapped in glow chrome. */
function GlowShell({ config, children }: { config: CartProps["config"]; children: React.ReactNode }) {
  const storeName = config?.store_name ?? "glow."
  return (
    <div className={s.page}>
      <PageLoader />
      <GlowLiveNav config={config} hasDeals={false} categories={[]} />
      <div className={s.headerSpacer} />
      <section className={s.section}>
        <div className={s.container}>{children}</div>
      </section>
      <Footer storeName={storeName} />
    </div>
  )
}

export function GlowCartLivePage({ config, cart }: CartProps) {
  return <GlowShell config={config}><CartContents cart={cart} /></GlowShell>
}

export function GlowCheckoutLivePage({ config, cart, shippingOptions, countries, hasRazorpay, error }: CheckoutProps) {
  return (
    <GlowShell config={config}>
      <CheckoutFlow cart={cart} shippingOptions={shippingOptions} countries={countries} hasRazorpay={hasRazorpay} error={error} />
    </GlowShell>
  )
}

export function GlowOrderLivePage({ config, order }: OrderProps) {
  return <GlowShell config={config}><OrderSummary order={order} /></GlowShell>
}
