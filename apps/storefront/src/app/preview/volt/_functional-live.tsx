"use client"

import Link from "next/link"
import { PageLoader, Footer } from "./_components"
import { VoltNav } from "./_live"
import { RazorpayCheckout } from "../../../components/razorpay-checkout"
import { SavedAddressPicker } from "../../../components/storefront/account/saved-address-picker"
import { deriveOrderStatus } from "../../../components/storefront/account/order-status-badge"
import {
  removeLineItemAction,
  updateLineItemAction,
  setAddressAction,
  setShippingMethodAction,
  placeOrderAction,
} from "../../../lib/cart/actions"
import { formatMoney } from "../../../lib/format"
import { isCompleteShippingAddress } from "../../../lib/cart/address"
import { SubmitButton } from "../../../components/submit-button"
import { SaveAndAdvance } from "../../../components/save-and-advance"
import type { CartProps, CheckoutProps, OrderProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

/**
 * Volt functional slots — best of both: the Volt template's visual language
 * (CSS classes / layout from the styled preview pages) fed REAL Medusa cart
 * data and wired to the real server actions (address / shipping / place order /
 * Razorpay). No mock data; orders are complete.
 */

function colorVars(config: CartProps["config"]) {
  return {
    ...(config?.accent_color ? { "--accent": config.accent_color } : {}),
    ...(config?.primary_color ? { "--text": config.primary_color } : {}),
    ...(config?.secondary_color ? { "--bg2": config.secondary_color } : {}),
  } as React.CSSProperties
}

/* ---- Cart ---- */
export function VoltCartLivePage({ config, cart, cartCount }: CartProps) {
  if (!cart || cart.items.length === 0) {
    return (
      <div className={s.pageShell} style={colorVars(config)}>
        <PageLoader />
        <VoltNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
        <div className={s.main}>
          <div className={s.container}>
            <div className={s.emptyState}>
              <div className={s.emptyStateIcon}>🛒</div>
              <div className={s.emptyStateTitle}>Your cart is empty</div>
              <p className={s.emptyStateText} style={{ marginBottom: 20 }}>Add items to get started</p>
              <Link href="/shop" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Start Shopping</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const cur = cart.currency_code
  return (
    <div className={s.pageShell} style={colorVars(config)}>
      <PageLoader />
      <VoltNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.main}>
        <div className={s.pageHeader}>
          <div className={s.container}>
            <div className={s.pageHeaderTitle}>Shopping Cart</div>
            <div className={s.pageHeaderSub}>{cart.items.length} item{cart.items.length !== 1 ? "s" : ""} in your cart</div>
          </div>
        </div>
        <div className={s.container}>
          <div className={s.cartLayout}>
            <div>
              {cart.items.map((item) => {
                const maxQty = item.availableQuantity == null ? undefined : item.quantity + item.availableQuantity
                const atMax = maxQty !== undefined && item.quantity >= maxQty
                return (
                <div key={item.id} className={s.cartItem}>
                  {item.handle ? (
                    <Link href={`/products/${item.handle}`} className={s.cartItemImg}>
                      {item.thumbnail ? <img src={item.thumbnail} alt={item.title} /> : null}
                    </Link>
                  ) : item.thumbnail ? (
                    <div className={s.cartItemImg}><img src={item.thumbnail} alt={item.title} /></div>
                  ) : <div className={s.cartItemImg} />}
                  <div>
                    <div className={s.cartItemName}>{item.product_title ?? item.title}</div>
                    {item.variant_title && <div className={s.cartItemMeta}>{item.variant_title}</div>}
                    <div className={s.cartItemMeta}>{formatMoney(item.unit_price, cur)} each</div>
                    <div className={s.qtyControl} style={{ marginTop: 10 }}>
                      <form action={updateLineItemAction} style={{ display: "inline" }}>
                        <input type="hidden" name="line_item_id" value={item.id} />
                        <input type="hidden" name="quantity" value={item.quantity - 1} />
                        <button className={s.qtyBtn} type="submit" aria-label="Decrease quantity">−</button>
                      </form>
                      <form action={updateLineItemAction} style={{ display: "inline" }}>
                        <input type="hidden" name="line_item_id" value={item.id} />
                        <input
                          type="number"
                          name="quantity"
                          min={1}
                          max={maxQty}
                          defaultValue={item.quantity}
                          className={s.qtyInput}
                          onBlur={e => e.currentTarget.form?.requestSubmit()}
                          onKeyDown={e => e.key === "Enter" && e.currentTarget.form?.requestSubmit()}
                        />
                      </form>
                      <form action={updateLineItemAction} style={{ display: "inline" }}>
                        <input type="hidden" name="line_item_id" value={item.id} />
                        <input type="hidden" name="quantity" value={item.quantity + 1} />
                        <button className={s.qtyBtn} type="submit" aria-label="Increase quantity" disabled={atMax}>+</button>
                      </form>
                    </div>
                    {/* Stock count intentionally hidden; the disabled + button enforces the max. */}
                  </div>
                  <div className={s.cartItemPrice}>
                    <div className={s.priceMain}>{formatMoney(item.total, cur)}</div>
                    <form action={removeLineItemAction}>
                      <input type="hidden" name="line_item_id" value={item.id} />
                      <button className={s.removeBtn} type="submit">Remove</button>
                    </form>
                  </div>
                </div>
                )
              })}
              <Link href="/shop" className={`${s.btn} ${s.btnSecondary}`} style={{ marginTop: 8 }}>← Continue Shopping</Link>
            </div>
            <div className={s.orderSummary}>
              <div className={s.orderSummaryTitle}>Order Summary</div>
              <div className={s.summaryRow}><span>Subtotal</span><span>{formatMoney(cart.subtotal, cur)}</span></div>
              <div className={s.summaryRow}><span>Shipping</span><span>{cart.shipping_total > 0 ? formatMoney(cart.shipping_total, cur) : "—"}</span></div>
              <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>{formatMoney(cart.total, cur)}</span></div>
              <Link href="/checkout" className={`${s.btn} ${s.btnPrimary} ${s.btnFull} ${s.btnLg}`} style={{ marginTop: 16, display: "flex" }}>Proceed to Checkout</Link>
              <div className={s.secureNote}>🔒 100% Secure · SSL Encrypted</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

/* ---- Checkout ---- */
export function VoltCheckoutLivePage({ config, cart, cartCount, shippingOptions, countries, hasRazorpay, error, savedAddresses, customer }: CheckoutProps) {
  const storeName = config?.store_name ?? "VOLT"

  if (!cart || cart.items.length === 0) {
    return (
      <div className={s.pageShell} style={colorVars(config)}>
        <PageLoader />
        <VoltNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
        <div className={s.main}>
          <div className={s.container}>
            <div className={s.emptyState}>
              <div className={s.emptyStateIcon}>🛒</div>
              <div className={s.emptyStateTitle}>Your cart is empty</div>
              <Link href="/shop" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`} style={{ marginTop: 16 }}>Start Shopping</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const cur = cart.currency_code
  const addr = cart.shipping_address
  const hasAddress = isCompleteShippingAddress(addr)
  const hasShipping = cart.shipping_methods.length > 0
  const addrName = [addr?.first_name, addr?.last_name].filter(Boolean).join(" ")
  const addrLine = [addr?.address_1, addr?.city, addr?.province, addr?.postal_code]
    .filter(Boolean)
    .join(", ")

  // Address entry — a saved-address picker (one click delivers) plus the manual
  // form. Reused in the empty state and behind the "Change address" disclosure
  // once an address is set, so the form never sits open next to a saved choice.
  const addressForm = (
    <>
      {savedAddresses && savedAddresses.length > 0 ? (
        <SavedAddressPicker addresses={savedAddresses} email={customer?.email ?? cart.email ?? ""} accent={config?.accent_color ?? undefined} />
      ) : null}
      <form action={setAddressAction} className={s.formGrid}>
        <div className={s.formGroup}><label className={s.formLabel}>First Name</label><input name="first_name" className={s.formInput} defaultValue={addr?.first_name ?? ""} required /></div>
        <div className={s.formGroup}><label className={s.formLabel}>Last Name</label><input name="last_name" className={s.formInput} defaultValue={addr?.last_name ?? ""} required /></div>
        <div className={s.formGroup}><label className={s.formLabel}>Email Address</label><input name="email" type="email" className={s.formInput} defaultValue={cart.email ?? ""} required /></div>
        <div className={s.formGroup}><label className={s.formLabel}>Mobile Number</label><input name="phone" type="tel" className={s.formInput} defaultValue={addr?.phone ?? ""} /></div>
        <div className={`${s.formGroup} ${s.formGroupFull}`}><label className={s.formLabel}>Address line 1</label><input name="address_1" className={s.formInput} defaultValue={addr?.address_1 ?? ""} placeholder="House / flat no., building, street" required /></div>
        <div className={`${s.formGroup} ${s.formGroupFull}`}><label className={s.formLabel}>Address line 2 (optional)</label><input name="address_2" className={s.formInput} defaultValue={addr?.address_2 ?? ""} placeholder="Area, locality" /></div>
        <div className={`${s.formGroup} ${s.formGroupFull}`}><label className={s.formLabel}>Landmark (optional)</label><input name="company" className={s.formInput} defaultValue={addr?.company ?? ""} placeholder="e.g. near Laxma Reddy shop (helps delivery)" /></div>
        <div className={s.formGroup}><label className={s.formLabel}>City</label><input name="city" className={s.formInput} defaultValue={addr?.city ?? ""} required /></div>
        <div className={s.formGroup}><label className={s.formLabel}>State / Province</label><input name="province" className={s.formInput} defaultValue={addr?.province ?? ""} /></div>
        <div className={s.formGroup}><label className={s.formLabel}>PIN Code</label><input name="postal_code" className={s.formInput} defaultValue={addr?.postal_code ?? ""} required /></div>
        <div className={s.formGroup}>
          <label className={s.formLabel}>Country</label>
          <select name="country_code" className={s.formSelect} defaultValue={addr?.country_code ?? (countries[0]?.iso_2 ?? "")} required>
            <option value="" disabled>Select country</option>
            {countries.map(c => <option key={c.iso_2} value={c.iso_2}>{c.display_name ?? c.iso_2.toUpperCase()}</option>)}
          </select>
        </div>
        <div className={s.formGroupFull}>
          <SubmitButton className={`${s.btn} ${s.btnPrimary}`} pendingLabel="Saving…">Save &amp; Continue</SubmitButton>
        </div>
      </form>
    </>
  )

  return (
    <div className={s.pageShell} style={colorVars(config)}>
      <PageLoader />
      <VoltNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.main}>
        <div className={s.pageHeader}>
          <div className={s.container}>
            <Link href="/cart" style={{ fontSize: 13, color: "var(--accent)" }}>← Back to Cart</Link>
            <div className={s.pageHeaderTitle} style={{ marginTop: 8 }}>Checkout</div>
          </div>
        </div>

        <div className={s.container}>
          {error && <div className={s.formCard} style={{ borderColor: "var(--danger,#dc2626)", marginBottom: 16 }}><div className={s.formCardBody} style={{ color: "var(--danger,#dc2626)" }}>{error}</div></div>}
          <div className={s.checkoutLayout}>
            <div className={s.checkoutForm}>
              {/* Step 1: Shipping address */}
              <div className={s.formCard} id="volt-address-section">
                <div className={s.formCardHead}>
                  <div className={s.formCardHeadNum}>{hasAddress ? "✓" : "1"}</div>
                  <div className={s.formCardHeadTitle}>Shipping Information</div>
                </div>
                <div className={s.formCardBody}>
                  {hasAddress ? (
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text)" }}>{addrName || "Saved address"}</div>
                      <div className={s.cartItemMeta} style={{ marginTop: 2 }}>{addrLine}</div>
                      {addr?.phone ? <div className={s.cartItemMeta}>{addr.phone}</div> : null}
                      {cart.email ? <div className={s.cartItemMeta}>{cart.email}</div> : null}
                      <details style={{ marginTop: 12 }}>
                        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--accent)" }}>Change address</summary>
                        <div style={{ marginTop: 14 }}>{addressForm}</div>
                      </details>
                    </div>
                  ) : (
                    addressForm
                  )}
                </div>
              </div>

              {/* Step 2: Shipping method */}
              <div className={s.formCard} id="volt-delivery-section">
                <div className={s.formCardHead}>
                  <div className={s.formCardHeadNum}>{hasShipping ? "✓" : "2"}</div>
                  <div className={s.formCardHeadTitle}>Delivery Method</div>
                </div>
                <div className={s.formCardBody}>
                  {!hasAddress ? (
                    <p className={s.cartItemMeta}>Enter your shipping details to see delivery options.</p>
                  ) : shippingOptions.length === 0 ? (
                    <p className={s.cartItemMeta}>No delivery options are available for this address.</p>
                  ) : (
                    <form action={setShippingMethodAction}>
                      {shippingOptions.map(option => (
                        <label key={option.id} className={s.summaryRow} style={{ cursor: "pointer" }}>
                          <span><input type="radio" name="option_id" value={option.id} required defaultChecked={shippingOptions.length === 1 || cart.shipping_methods.some(m => m.name === option.name)} /> {option.name}</span>
                          <span>{formatMoney(option.amount ?? 0, cur)}</span>
                        </label>
                      ))}
                      <SubmitButton className={`${s.btn} ${s.btnSecondary}`} style={{ marginTop: 12 }} pendingLabel="Saving…">Use this method</SubmitButton>
                      <SaveAndAdvance nextSectionId="volt-payment-section" label="Delivery method saved" />
                    </form>
                  )}
                </div>
              </div>

              {/* Step 3: Payment */}
              <div className={s.formCard} id="volt-payment-section">
                <div className={s.formCardHead}>
                  <div className={s.formCardHeadNum}>3</div>
                  <div className={s.formCardHeadTitle}>Payment</div>
                </div>
                <div className={s.formCardBody}>
                  {hasAddress && hasShipping ? (
                    hasRazorpay ? (
                      <RazorpayCheckout storeName={storeName} accentColor={config?.accent_color ?? undefined} email={cart.email} />
                    ) : (
                      <form action={placeOrderAction}><SubmitButton className={`${s.btn} ${s.btnPrimary} ${s.btnFull} ${s.btnLg}`} pendingLabel="Placing order…">Place Order</SubmitButton></form>
                    )
                  ) : (
                    <p className={s.cartItemMeta}>Complete the steps above to pay.</p>
                  )}
                </div>
              </div>
              <div className={s.secureNote}>🔒 256-bit SSL encryption · Secured by Razorpay</div>
            </div>

            {/* Summary */}
            <div className={s.orderSummary}>
              <div className={s.orderSummaryTitle}>Order Summary</div>
              {cart.items.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "var(--bg2)", flexShrink: 0 }}>
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.title} /> : null}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{item.product_title ?? item.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text3)" }}>Qty {item.quantity}{item.variant_title ? ` · ${item.variant_title}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{formatMoney(item.total, cur)}</div>
                </div>
              ))}
              <hr className={s.divider} />
              <div className={s.summaryRow}><span>Subtotal</span><span>{formatMoney(cart.subtotal, cur)}</span></div>
              <div className={s.summaryRow}><span>Shipping</span><span>{cart.shipping_total > 0 ? formatMoney(cart.shipping_total, cur) : "—"}</span></div>
              <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>{formatMoney(cart.total, cur)}</span></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

/* ---- Order confirmation ---- */
export function VoltOrderLivePage({ config, cartCount, order }: OrderProps) {
  // Live status (cancelled/shipped/delivered…) derived from Medusa, so a status
  // change in admin is reflected here instead of a permanent "Order Confirmed!".
  const status = deriveOrderStatus(order)
  const cancelled = status.label === "Cancelled"
  const headline = cancelled
    ? "Order Cancelled"
    : status.label === "Shipped"
      ? "Your order has shipped"
      : status.label === "Delivered"
        ? "Order Delivered"
        : "Order Confirmed!"
  const ship = order.shipping_address
  const shipName = ship ? [ship.first_name, ship.last_name].filter(Boolean).join(" ") : ""
  const shipStreet = ship ? [ship.address_1, ship.address_2].filter(Boolean).join(", ") : ""
  const shipCity = ship ? [ship.city, ship.province, ship.postal_code].filter(Boolean).join(", ") : ""
  return (
    <div className={s.pageShell} style={colorVars(config)}>
      <PageLoader />
      <VoltNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.main}>
        <div className={s.container}>
          <section className={s.section}>
            <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
              <div style={{ fontSize: 64, marginBottom: 20 }} aria-hidden>{cancelled ? "❌" : "✅"}</div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>{headline}</h1>
              <div style={{ marginBottom: 16 }}>
                <span style={{ display: "inline-block", fontSize: 12.5, fontWeight: 700, color: status.color, background: status.bg, borderRadius: 999, padding: "5px 14px" }}>
                  {status.label}
                </span>
              </div>
              <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 28 }}>
                {cancelled ? (
                  <>This order was cancelled. If this is unexpected, contact support.</>
                ) : (
                  <>
                    Thank you for your order
                    {order.email ? <> — a receipt is on its way to {order.email}</> : null}.
                  </>
                )}
              </p>

              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 28px", marginBottom: 20, borderTop: "3px solid var(--accent)" }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--text3)", marginBottom: 6 }}>Order ID</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: 1 }}>#{order.display_id}</div>
              </div>

              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 24px", marginBottom: 36, textAlign: "left" }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 14, color: "var(--text2)" }}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "var(--bg3,#f1f5f9)" }} />
                    ) : null}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {item.handle ? (
                        <Link href={`/products/${item.handle}`} style={{ color: "var(--text)" }}>{item.title}</Link>
                      ) : (
                        <span style={{ color: "var(--text)" }}>{item.title}</span>
                      )}
                      <span style={{ color: "var(--text3)" }}> × {item.quantity}</span>
                    </span>
                    <strong style={{ color: "var(--text)", whiteSpace: "nowrap" }}>{formatMoney(item.total, order.currency_code)}</strong>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
                  <span>Total</span><span>{formatMoney(order.total, order.currency_code)}</span>
                </div>
              </div>

              {ship ? (
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 24px", marginBottom: 36, textAlign: "left" }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>Delivery address</div>
                  <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 700 }}>{shipName || "—"}</div>
                  <div style={{ fontSize: 13.5, color: "var(--text2)", marginTop: 4, lineHeight: 1.6 }}>
                    {shipStreet ? <>{shipStreet}<br /></> : null}
                    {ship.company ? <>Landmark: {ship.company}<br /></> : null}
                    {shipCity ? <>{shipCity}<br /></> : null}
                    {ship.country_code ? ship.country_code.toUpperCase() : null}
                    {ship.phone ? <> · {ship.phone}</> : null}
                  </div>
                </div>
              ) : null}

              {!cancelled ? (
                <div className={s.grid3} style={{ marginBottom: 36 }}>
                  {[
                    { icon: "📦", title: "Packed Same Day", text: "Your order is being picked and packed" },
                    { icon: "🚚", title: "Delivery in 2–3 days", text: "Tracked and insured shipping" },
                    { icon: "📱", title: "Track via SMS", text: "You'll receive tracking updates on your phone" },
                  ].map(step => (
                    <div key={step.title} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden>{step.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{step.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text3)" }}>{step.text}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <Link href="/shop" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Continue Shopping</Link>
                <Link href="/" className={`${s.btn} ${s.btnSecondary} ${s.btnLg}`}>Back to Home</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
