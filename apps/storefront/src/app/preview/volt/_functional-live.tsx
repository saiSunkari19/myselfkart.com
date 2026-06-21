"use client"

import { PageLoader, Footer } from "./_components"
import { VoltNav } from "./_live"
import { CartContents } from "../../../components/storefront/cart-contents"
import { CheckoutFlow } from "../../../components/storefront/checkout-flow"
import { OrderSummary } from "../../../components/storefront/order-summary"
import type { CartProps, CheckoutProps, OrderProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/**
 * Volt functional slots (Cart / Checkout / Order). These wrap the shared,
 * theme-agnostic functional components in Volt chrome — the buyer keeps the
 * Volt nav/footer through the whole journey, while the forms + server actions
 * (incl. Razorpay) stay shared and unchanged.
 */

function VoltShell({ config, children }: { config: CartProps["config"]; children: React.ReactNode }) {
  const colorOverrides = {
    ...(config?.accent_color ? { "--accent": config.accent_color } : {}),
    ...(config?.primary_color ? { "--text": config.primary_color } : {}),
    ...(config?.secondary_color ? { "--bg2": config.secondary_color } : {}),
  } as React.CSSProperties
  return (
    <div className={s.pageShell} style={colorOverrides}>
      <PageLoader />
      <VoltNav config={config} hasDeals={false} categories={[]} />
      <div className={s.main}>
        <div className={s.container}>
          <section className={s.section}>{children}</section>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export function VoltCartLivePage({ config, cart }: CartProps) {
  return (
    <VoltShell config={config}>
      <CartContents cart={cart} />
    </VoltShell>
  )
}

export function VoltCheckoutLivePage({ config, cart, shippingOptions, countries, hasRazorpay, error }: CheckoutProps) {
  return (
    <VoltShell config={config}>
      <CheckoutFlow
        cart={cart}
        shippingOptions={shippingOptions}
        countries={countries}
        hasRazorpay={hasRazorpay}
        error={error}
      />
    </VoltShell>
  )
}

export function VoltOrderLivePage({ config, order }: OrderProps) {
  return (
    <VoltShell config={config}>
      <OrderSummary order={order} />
    </VoltShell>
  )
}
