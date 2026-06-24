"use client"

import Link from "next/link"
import { RazorpayCheckout } from "../../../components/razorpay-checkout"
import { SavedAddressPicker } from "../../../components/storefront/account/saved-address-picker"
import {
  removeLineItemAction,
  updateLineItemAction,
  setAddressAction,
  setShippingMethodAction,
  placeOrderAction,
} from "../../../lib/cart/actions"
import { formatMoney } from "../../../lib/format"
import type { CartProps, CheckoutProps, OrderProps } from "../../../lib/themes/types"
import { ThreadNav, ThreadFooter, threadColorVars } from "./_live"
import { SubmitButton } from "../../../components/submit-button"
import { SaveAndAdvance } from "../../../components/save-and-advance"
import s from "./_styles.module.css"

/**
 * Thread functional slots — the Thread template's visual language fed REAL Medusa
 * cart data and wired to the real server actions (address / shipping / place
 * order / Razorpay). No mock data; orders are complete.
 */

/* ---- Cart ---- */
export function ThreadCartLivePage({ config, cart, cartCount }: CartProps) {
  if (!cart || cart.items.length === 0) {
    return (
      <div className={s.page} style={threadColorVars(config)}>
        <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
        <div className={s.pageShell}>
          <div className={s.container}>
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>🛍️</div>
              <h2 className={s.emptyTitle}>Your bag is empty</h2>
              <p className={s.emptyText}>Looks like you haven&apos;t added anything yet.</p>
              <Link href="/shop" className={s.btn}>Start Shopping</Link>
            </div>
          </div>
        </div>
        <ThreadFooter config={config} />
      </div>
    )
  }

  const cur = cart.currency_code
  const itemCount = cart.items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.pageTitle}>
            <div className={s.pageTitleLabel}>Your Bag</div>
            <h1 className={s.pageTitleText}>Shopping Bag</h1>
            <p className={s.pageTitleSub}>{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
          </div>

          <div className={s.cartLayout}>
            <div>
              {cart.items.map(item => {
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
                    <div className={s.qtyRow}>
                      <form action={updateLineItemAction} style={{ display: "inline" }}>
                        <input type="hidden" name="line_item_id" value={item.id} />
                        <input type="hidden" name="quantity" value={Math.max(1, item.quantity - 1)} />
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
                    {maxQty !== undefined && (
                      <div className={s.cartItemMeta} style={{ color: atMax ? "#c0392b" : undefined }}>
                        {atMax ? "Max available quantity reached" : `${maxQty} available`}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 8 }}>
                      {formatMoney(item.total, cur)}
                    </div>
                    <form action={removeLineItemAction}>
                      <input type="hidden" name="line_item_id" value={item.id} />
                      <button className={s.removeBtn} type="submit">Remove</button>
                    </form>
                  </div>
                </div>
                )
              })}

              <div style={{ marginTop: 28 }}>
                <Link href="/shop" className={`${s.btn} ${s.btnOutline}`}>← Continue Shopping</Link>
              </div>
            </div>

            <div className={s.orderSummary}>
              <div className={s.orderSummaryTitle}>Order Summary</div>
              <div className={s.summaryRow}><span>Subtotal</span><span>{formatMoney(cart.subtotal, cur)}</span></div>
              <div className={s.summaryRow}>
                <span>Shipping</span>
                <span style={{ color: cart.shipping_total === 0 ? "#22c55e" : undefined }}>
                  {cart.shipping_total > 0 ? formatMoney(cart.shipping_total, cur) : "Free"}
                </span>
              </div>
              <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>{formatMoney(cart.total, cur)}</span></div>
              <Link href="/checkout" className={`${s.btn} ${s.btnFull}`} style={{ marginTop: 20, display: "flex" }}>
                Proceed to Checkout →
              </Link>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
                {["💳 Secure", "🔒 Encrypted", "↩️ Easy returns"].map(t => (
                  <span key={t} style={{ fontSize: 11, color: "#a09890" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ThreadFooter config={config} />
    </div>
  )
}

/* ---- Checkout ---- */
export function ThreadCheckoutLivePage({ config, cart, cartCount, shippingOptions, countries, hasRazorpay, error, savedAddresses, customer }: CheckoutProps) {
  const storeName = config?.store_name ?? "Thread"

  if (!cart || cart.items.length === 0) {
    return (
      <div className={s.page} style={threadColorVars(config)}>
        <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
        <div className={s.pageShell}>
          <div className={s.container}>
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>🛍️</div>
              <h2 className={s.emptyTitle}>Your bag is empty</h2>
              <Link href="/shop" className={s.btn}>Start Shopping</Link>
            </div>
          </div>
        </div>
        <ThreadFooter config={config} />
      </div>
    )
  }

  const cur = cart.currency_code
  const addr = cart.shipping_address
  const hasAddress = Boolean(addr)
  const hasShipping = cart.shipping_methods.length > 0

  const Step = ({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: done ? "#22c55e" : active ? "#1a1a1a" : "#e8e4df",
        color: done || active ? "#fff" : "#a09890",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700,
      }}>{done ? "✓" : n}</div>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#1a1a1a" : "#a09890" }}>{label}</span>
    </div>
  )

  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.pageTitle}>
            <Link href="/cart" style={{ fontSize: 13, color: "#a09890", textDecoration: "none", display: "block", marginBottom: 8 }}>
              ← Back to Bag
            </Link>
            <h1 className={s.pageTitleText}>Checkout</h1>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div className={s.checkoutLayout}>
            <div className={s.checkoutForm}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
                <Step n={1} label="Shipping" done={hasAddress} active={!hasAddress} />
                <span style={{ color: "#e8e4df" }}>→</span>
                <Step n={2} label="Delivery" done={hasShipping} active={hasAddress && !hasShipping} />
                <span style={{ color: "#e8e4df" }}>→</span>
                <Step n={3} label="Payment" done={false} active={hasAddress && hasShipping} />
              </div>

              {/* Step 1: Shipping address */}
              <div className={s.formSection} id="thread-address-section">
                <div className={s.formSectionTitle}>{hasAddress ? "✓ " : "1. "}Shipping Information</div>
                {savedAddresses && savedAddresses.length > 0 ? (
                  <SavedAddressPicker addresses={savedAddresses} email={customer?.email ?? cart.email ?? ""} accent={config?.accent_color ?? undefined} />
                ) : null}
                <form action={setAddressAction} className={s.formGrid}>
                  <div className={s.formGroup}><label className={s.formLabel}>First Name</label><input name="first_name" className={s.formInput} defaultValue={addr?.first_name ?? ""} required /></div>
                  <div className={s.formGroup}><label className={s.formLabel}>Last Name</label><input name="last_name" className={s.formInput} defaultValue={addr?.last_name ?? ""} required /></div>
                  <div className={s.formGroup}><label className={s.formLabel}>Email</label><input name="email" type="email" className={s.formInput} defaultValue={cart.email ?? ""} required /></div>
                  <div className={s.formGroup}><label className={s.formLabel}>Phone</label><input name="phone" type="tel" className={s.formInput} defaultValue={addr?.phone ?? ""} /></div>
                  <div className={s.formGroup} style={{ gridColumn: "1 / -1" }}><label className={s.formLabel}>Address</label><input name="address_1" className={s.formInput} defaultValue={addr?.address_1 ?? ""} required /></div>
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
                  <div style={{ gridColumn: "1 / -1" }}>
                    <SubmitButton className={`${s.btn} ${s.btnFull}`} pendingLabel="Saving…">Save &amp; Continue</SubmitButton>
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <SaveAndAdvance nextSectionId="thread-delivery-section" label="Address saved" style={{ marginLeft: 0 }} />
                    </div>
                  </div>
                </form>
              </div>

              {/* Step 2: Delivery method */}
              <div className={s.formSection} id="thread-delivery-section">
                <div className={s.formSectionTitle}>{hasShipping ? "✓ " : "2. "}Delivery Method</div>
                {!hasAddress ? (
                  <p className={s.cartItemMeta}>Enter your shipping details to see delivery options.</p>
                ) : shippingOptions.length === 0 ? (
                  <p className={s.cartItemMeta}>No delivery options are available for this address.</p>
                ) : (
                  <form action={setShippingMethodAction}>
                    {shippingOptions.map(option => (
                      <label key={option.id} className={s.summaryRow} style={{ cursor: "pointer" }}>
                        <span><input type="radio" name="option_id" value={option.id} required defaultChecked={cart.shipping_methods.some(m => m.name === option.name)} /> {option.name}</span>
                        <span>{formatMoney(option.amount ?? 0, cur)}</span>
                      </label>
                    ))}
                    <SubmitButton className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: 12 }} pendingLabel="Saving…">Use this method</SubmitButton>
                    <SaveAndAdvance nextSectionId="thread-payment-section" label="Delivery method saved" />
                  </form>
                )}
              </div>

              {/* Step 3: Payment */}
              <div className={s.formSection} id="thread-payment-section">
                <div className={s.formSectionTitle}>3. Payment</div>
                {hasAddress && hasShipping ? (
                  hasRazorpay ? (
                    <RazorpayCheckout storeName={storeName} accentColor={config?.accent_color ?? undefined} email={cart.email} />
                  ) : (
                    <form action={placeOrderAction}><SubmitButton className={`${s.btn} ${s.btnFull}`} pendingLabel="Placing order…">Place Order</SubmitButton></form>
                  )
                ) : (
                  <p className={s.cartItemMeta}>Complete the steps above to pay.</p>
                )}
              </div>
            </div>

            {/* Order summary */}
            <div className={s.orderSummary}>
              <div className={s.orderSummaryTitle}>Your Order</div>
              {cart.items.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "center" }}>
                  <div style={{ width: 56, aspectRatio: "3/4", borderRadius: 8, overflow: "hidden", background: "#f0ebe2", flexShrink: 0 }}>
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{item.product_title ?? item.title}</div>
                    <div style={{ fontSize: 12, color: "#a09890" }}>Qty: {item.quantity}{item.variant_title ? ` · ${item.variant_title}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", flexShrink: 0 }}>{formatMoney(item.total, cur)}</div>
                </div>
              ))}
              <hr style={{ border: "none", borderTop: "1px solid #e8e4df", margin: "16px 0" }} />
              <div className={s.summaryRow}><span>Subtotal</span><span>{formatMoney(cart.subtotal, cur)}</span></div>
              <div className={s.summaryRow}>
                <span>Shipping</span>
                <span style={{ color: cart.shipping_total === 0 ? "#22c55e" : undefined }}>{cart.shipping_total > 0 ? formatMoney(cart.shipping_total, cur) : "Free"}</span>
              </div>
              <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>{formatMoney(cart.total, cur)}</span></div>
            </div>
          </div>
        </div>
      </div>
      <ThreadFooter config={config} />
    </div>
  )
}

/* ---- Order confirmation ---- */
export function ThreadOrderLivePage({ config, cartCount, order }: OrderProps) {
  const cur = order.currency_code
  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.confirmationWrap}>
            <div className={s.confirmationIcon}>✅</div>
            <h1 className={s.confirmationTitle}>Order Placed!</h1>
            <p className={s.confirmationSub}>
              Thank you for your order. {order.email ? `A confirmation email is on its way to ${order.email}. ` : ""}
              Your pieces are being prepared with care.
            </p>

            <div className={s.orderCard}>
              <div className={s.orderCardTitle}>Order Details</div>
              <div className={s.orderCardRow}><span>Order ID</span><strong>#{order.display_id}</strong></div>
              {order.email && <div className={s.orderCardRow}><span>Email</span><strong>{order.email}</strong></div>}
            </div>

            <div className={s.orderCard}>
              <div className={s.orderCardTitle}>Items Ordered</div>
              {order.items.map(item => (
                <div key={item.id} className={s.orderCardRow}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {item.thumbnail && <img src={item.thumbnail} alt="" width={40} height={40} style={{ borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                    <span>
                      {item.handle ? <Link href={`/products/${item.handle}`} style={{ color: "inherit" }}>{item.title}</Link> : item.title} × {item.quantity}
                    </span>
                  </span>
                  <strong>{formatMoney(item.total, cur)}</strong>
                </div>
              ))}
              <div className={s.orderCardRow} style={{ fontWeight: 700 }}>
                <span style={{ color: "#1a1a1a", fontWeight: 700 }}>Total</span>
                <strong>{formatMoney(order.total, cur)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/" className={`${s.btn} ${s.btnOutline}`}>Back to Home</Link>
              <Link href="/shop" className={s.btn}>Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
      <ThreadFooter config={config} />
    </div>
  )
}
