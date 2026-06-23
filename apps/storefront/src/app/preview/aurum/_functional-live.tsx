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
import { AurumNav, AurumFooter, aurumColorVars } from "./_live"
import { SubmitButton } from "../../../components/submit-button"
import { SaveAndAdvance } from "../../../components/save-and-advance"
import s from "./_styles.module.css"

/**
 * Aurum functional slots — the Aurum (fine-jewellery) visual language fed REAL
 * Medusa cart data and wired to the real server actions (address / shipping /
 * place order / Razorpay). No mock data; orders are complete.
 */

/* ---- Cart ---- */
export function AurumCartLivePage({ config, cart, cartCount }: CartProps) {
  if (!cart || cart.items.length === 0) {
    return (
      <div className={s.page} style={aurumColorVars(config)}>
        <AurumNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
        <div className={s.pageShell}>
          <div className={s.container}>
            <div className={s.emptyState} style={{ padding: "120px 0" }}>
              <div className={s.emptyIcon}>◇</div>
              <div className={s.emptyTitle}>Your bag is empty</div>
              <p className={s.emptyText}>Add a piece to your bag to begin your journey.</p>
              <Link href="/shop" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>Explore Collection</Link>
            </div>
          </div>
        </div>
        <AurumFooter config={config} />
      </div>
    )
  }

  const cur = cart.currency_code

  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.pageHeader} style={{ textAlign: "left", padding: "60px 0 40px", marginBottom: 0 }}>
            <div className={s.pageHeaderLabel}>Your Selection</div>
            <h1 className={s.pageHeaderTitle} style={{ textAlign: "left" }}>Shopping Bag</h1>
          </div>

          <div className={s.cartLayout}>
            <div>
              {cart.items.map(item => {
                const maxQty = item.availableQuantity == null ? undefined : item.quantity + item.availableQuantity
                const atMax = maxQty !== undefined && item.quantity >= maxQty
                return (
                <div key={item.id} className={s.cartItem}>
                  {item.thumbnail ? (
                    <div className={s.cartItemImg}><img src={item.thumbnail} alt={item.title} /></div>
                  ) : <div className={s.cartItemImg} />}
                  <div>
                    <div className={s.cartItemName}>{item.product_title ?? item.title}</div>
                    {item.variant_title && <div className={s.cartItemMeta}>{item.variant_title}</div>}
                    <div className={s.cartItemMeta}>{formatMoney(item.unit_price, cur)} each</div>
                    <div className={s.cartItemCert}>✦ Certified · BIS Hallmarked</div>
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
                      <div className={s.cartItemMeta} style={{ color: atMax ? "#b8463a" : undefined }}>
                        {atMax ? "Max available quantity reached" : maxQty <= 5 ? `Only ${maxQty} available` : null}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 17, fontWeight: 500, color: "#1a1410", marginBottom: 8 }}>
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
                <span style={{ color: cart.shipping_total === 0 ? "#2d6a4f" : undefined }}>
                  {cart.shipping_total > 0 ? formatMoney(cart.shipping_total, cur) : "Free"}
                </span>
              </div>
              <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>{formatMoney(cart.total, cur)}</span></div>
              <Link href="/checkout" className={`${s.btn} ${s.btnGold} ${s.btnFull} ${s.btnLg}`} style={{ marginTop: 20, display: "flex" }}>
                Proceed to Checkout
              </Link>
              <div className={s.secureNote}>
                🔒 Secure checkout · 256-bit SSL · Insured shipping
              </div>
            </div>
          </div>
        </div>
      </div>
      <AurumFooter config={config} />
    </div>
  )
}

/* ---- Checkout ---- */
export function AurumCheckoutLivePage({ config, cart, cartCount, shippingOptions, countries, hasRazorpay, error, savedAddresses, customer }: CheckoutProps) {
  const storeName = config?.store_name ?? "Aurum"

  if (!cart || cart.items.length === 0) {
    return (
      <div className={s.page} style={aurumColorVars(config)}>
        <AurumNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
        <div className={s.pageShell}>
          <div className={s.container}>
            <div className={s.emptyState} style={{ padding: "120px 0" }}>
              <div className={s.emptyIcon}>◇</div>
              <div className={s.emptyTitle}>Your bag is empty</div>
              <Link href="/shop" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>Explore Collection</Link>
            </div>
          </div>
        </div>
        <AurumFooter config={config} />
      </div>
    )
  }

  const cur = cart.currency_code
  const addr = cart.shipping_address
  const hasAddress = Boolean(addr)
  const hasShipping = cart.shipping_methods.length > 0

  const Step = ({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 32, height: 32,
        border: `1.5px solid ${done ? "#b8962e" : active ? "#1a1410" : "#e8e0d4"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 600,
        background: done ? "#fdf9f4" : active ? "#1a1410" : "#fff",
        color: done ? "#b8962e" : active ? "#fff" : "#a09080",
      }}>{done ? "✓" : n}</div>
      <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: active ? "#1a1410" : "#a09080", fontWeight: active ? 700 : 400 }}>{label}</span>
    </div>
  )

  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div style={{ padding: "40px 0 0" }}>
            <Link href="/cart" style={{ fontSize: 12, color: "#a09080", letterSpacing: 0.5, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              ← Back to Bag
            </Link>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "24px 0 40px" }}>
            <Step n={1} label="Shipping" done={hasAddress} active={!hasAddress} />
            <span style={{ color: "#e8e0d4", margin: "0 8px", fontSize: 16 }}>→</span>
            <Step n={2} label="Delivery" done={hasShipping} active={hasAddress && !hasShipping} />
            <span style={{ color: "#e8e0d4", margin: "0 8px", fontSize: 16 }}>→</span>
            <Step n={3} label="Payment" done={false} active={hasAddress && hasShipping} />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px 16px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div className={s.checkoutLayout}>
            <div className={s.checkoutForm}>
              {/* Step 1: Shipping address */}
              <div className={s.formBlock} id="aurum-address-section">
                <div className={s.formBlockTitle}>{hasAddress ? "✓ " : ""}Contact &amp; Shipping Information</div>
                {savedAddresses && savedAddresses.length > 0 ? (
                  <SavedAddressPicker addresses={savedAddresses} email={customer?.email ?? cart.email ?? ""} accent={config?.accent_color ?? undefined} />
                ) : null}
                <form action={setAddressAction} className={s.formGrid}>
                  <div className={s.formGroup}><label className={s.formLabel}>First Name</label><input name="first_name" className={s.formInput} defaultValue={addr?.first_name ?? ""} required /></div>
                  <div className={s.formGroup}><label className={s.formLabel}>Last Name</label><input name="last_name" className={s.formInput} defaultValue={addr?.last_name ?? ""} required /></div>
                  <div className={s.formGroup}><label className={s.formLabel}>Email Address</label><input name="email" type="email" className={s.formInput} defaultValue={cart.email ?? ""} required /></div>
                  <div className={s.formGroup}><label className={s.formLabel}>Mobile Number</label><input name="phone" type="tel" className={s.formInput} defaultValue={addr?.phone ?? ""} /></div>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}><label className={s.formLabel}>Shipping Address</label><input name="address_1" className={s.formInput} defaultValue={addr?.address_1 ?? ""} required /></div>
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
                    <SubmitButton className={`${s.btn} ${s.btnGold} ${s.btnFull} ${s.btnLg}`} pendingLabel="Saving…">Save &amp; Continue</SubmitButton>
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <SaveAndAdvance nextSectionId="aurum-delivery-section" label="Address saved" style={{ marginLeft: 0 }} />
                    </div>
                  </div>
                </form>
              </div>

              {/* Step 2: Delivery method */}
              <div className={s.formBlock} id="aurum-delivery-section">
                <div className={s.formBlockTitle}>{hasShipping ? "✓ " : ""}Delivery Method</div>
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
                    <SubmitButton className={`${s.btn} ${s.btnOutlineGold}`} style={{ marginTop: 12 }} pendingLabel="Saving…">Use this method</SubmitButton>
                    <SaveAndAdvance nextSectionId="aurum-payment-section" label="Delivery method saved" />
                  </form>
                )}
              </div>

              {/* Step 3: Payment */}
              <div className={s.formBlock} id="aurum-payment-section">
                <div className={s.formBlockTitle}>Payment</div>
                {hasAddress && hasShipping ? (
                  hasRazorpay ? (
                    <RazorpayCheckout storeName={storeName} accentColor={config?.accent_color ?? undefined} email={cart.email} />
                  ) : (
                    <form action={placeOrderAction}><SubmitButton className={`${s.btn} ${s.btnGold} ${s.btnFull} ${s.btnLg}`} pendingLabel="Placing order…">Place Order</SubmitButton></form>
                  )
                ) : (
                  <p className={s.cartItemMeta}>Complete the steps above to pay.</p>
                )}
              </div>

              <div style={{ fontSize: 11, color: "#a09080", textAlign: "center", letterSpacing: 0.5 }}>
                🔒 256-bit SSL encryption · All payments secured by Razorpay
              </div>
            </div>

            {/* Order summary */}
            <div className={s.orderSummary}>
              <div className={s.orderSummaryTitle}>Your Order</div>
              {cart.items.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                  <div style={{ width: 64, aspectRatio: "3/4", overflow: "hidden", background: "#fdf9f4", flexShrink: 0 }}>
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1410", marginBottom: 2 }}>{item.product_title ?? item.title}</div>
                    <div style={{ fontSize: 11, color: "#a09080" }}>Qty: {item.quantity}{item.variant_title ? ` · ${item.variant_title}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1410", flexShrink: 0 }}>{formatMoney(item.total, cur)}</div>
                </div>
              ))}
              <hr style={{ border: "none", borderTop: "1px solid #e8e0d4", margin: "16px 0" }} />
              <div className={s.summaryRow}><span>Subtotal</span><span>{formatMoney(cart.subtotal, cur)}</span></div>
              <div className={s.summaryRow}>
                <span>Insured Shipping</span>
                <span style={{ color: cart.shipping_total === 0 ? "#2d6a4f" : undefined }}>{cart.shipping_total > 0 ? formatMoney(cart.shipping_total, cur) : "Free"}</span>
              </div>
              <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>{formatMoney(cart.total, cur)}</span></div>
            </div>
          </div>
        </div>
      </div>
      <AurumFooter config={config} />
    </div>
  )
}

/* ---- Order confirmation ---- */
export function AurumOrderLivePage({ config, cartCount, order }: OrderProps) {
  const cur = order.currency_code
  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <div className={s.pageShell}>
        <div className={s.container}>
          <div className={s.confirmWrap}>
            <div className={s.confirmIcon}>✦</div>
            <div className={s.pageHeaderLabel}>Order Confirmed</div>
            <h1 className={s.confirmTitle}>Thank you for your order</h1>
            <p className={s.confirmSub}>
              Your order has been placed successfully.
              {order.email ? ` A confirmation email is on its way to ${order.email}.` : ""}
            </p>

            <div className={s.confirmCard}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#a09080", marginBottom: 8 }}>Order Reference</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#b8962e", letterSpacing: 2, fontFamily: "Georgia, serif" }}>#{order.display_id}</div>
            </div>

            <div className={s.confirmCard}>
              <div className={s.orderSummaryTitle}>Items Ordered</div>
              {order.items.map(item => (
                <div key={item.id} className={s.summaryRow}>
                  <span>{item.title} × {item.quantity}</span>
                  <strong>{formatMoney(item.total, cur)}</strong>
                </div>
              ))}
              <div className={`${s.summaryRow} ${s.summaryRowTotal}`}>
                <span>Total</span>
                <strong>{formatMoney(order.total, cur)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/shop" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>Continue Shopping</Link>
              <Link href="/" className={`${s.btn} ${s.btnOutline} ${s.btnLg}`}>Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
      <AurumFooter config={config} />
    </div>
  )
}
