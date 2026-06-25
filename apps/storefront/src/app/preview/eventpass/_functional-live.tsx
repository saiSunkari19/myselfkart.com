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
import { EventpassNav, EventpassFooter, T, eventAccent, pageShell } from "./_live"
import { SubmitButton } from "../../../components/submit-button"
import { SaveAndAdvance } from "../../../components/save-and-advance"

/**
 * Eventpass functional slots — the Eventpass visual language (inline `T` tokens,
 * contact-details card look, stepper) fed REAL Medusa cart data and wired to the
 * real server actions (address / shipping / place order / Razorpay). No mock
 * data; orders are complete. Tickets = line items; "e-tickets" framing.
 */

// ---- small shared styles ----
const cardStyle: React.CSSProperties = {
  background: T.bgCard, border: `1px solid ${T.border}`,
  borderRadius: T.radiusLg, padding: 24, boxShadow: T.shadow,
}
const labelStyle: React.CSSProperties = {
  display: "block", color: T.textMuted, fontSize: 12, fontWeight: 600, marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`,
  borderRadius: T.radiusSm, fontSize: 14, color: T.text, background: "#fff", outline: "none",
}
const rowStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  fontSize: 14, color: T.textMuted, padding: "8px 0",
}

function EmptyShell({ config, icon, title, sub }: { config: CartProps["config"]; icon: string; title: string; sub?: string }) {
  const accent = eventAccent(config)
  return (
    <div style={pageShell()}>
      <EventpassNav config={config} cartCount={0} hasDeals={false} categories={[]} />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ textAlign: "center", padding: "60px 24px", background: T.bgSubtle, border: `1px solid ${T.border}`, borderRadius: T.radiusLg }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>{icon}</div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>{title}</h2>
          {sub && <p style={{ color: T.textMuted, fontSize: 15, margin: "0 0 24px" }}>{sub}</p>}
          <Link href="/shop" style={{ background: accent, color: "#fff", textDecoration: "none", borderRadius: T.radiusSm, padding: "12px 24px", fontSize: 14, fontWeight: 700 }}>
            Browse Events
          </Link>
        </div>
      </main>
      <EventpassFooter config={config} />
    </div>
  )
}

/* ---- Cart ---- */
export function EventpassCartLivePage({ config, cart, cartCount }: CartProps) {
  const accent = eventAccent(config)
  if (!cart || cart.items.length === 0) {
    return <EmptyShell config={config} icon="🛒" title="Your cart is empty" sub="Find an event and grab your tickets." />
  }

  const cur = cart.currency_code
  const itemCount = cart.items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div style={pageShell()}>
      <EventpassNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 40px 72px" }}>
        <h1 style={{ color: T.text, fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-1px" }}>Your Tickets</h1>
        <p style={{ color: T.textMuted, fontSize: 15, margin: "0 0 32px" }}>{itemCount} ticket{itemCount !== 1 ? "s" : ""} in your cart</p>

        <div className="ep-cart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {cart.items.map(item => {
              const maxQty = item.availableQuantity == null ? undefined : item.quantity + item.availableQuantity
              const atMax = maxQty !== undefined && item.quantity >= maxQty
              return (
              <div key={item.id} style={{ ...cardStyle, display: "flex", gap: 16, alignItems: "center", padding: 16 }}>
                <Link
                  href={item.handle ? `/products/${item.handle}` : "#"}
                  style={{ width: 72, height: 72, borderRadius: T.radiusSm, overflow: "hidden", background: T.bgSubtle, flexShrink: 0, display: "block" }}
                >
                  {item.thumbnail && <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{item.product_title ?? item.title}</div>
                  {item.variant_title && <div style={{ color: T.textMuted, fontSize: 13 }}>{item.variant_title}</div>}
                  <div style={{ color: T.textLight, fontSize: 13, marginTop: 2 }}>{formatMoney(item.unit_price, cur)} each</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <form action={updateLineItemAction} style={{ display: "inline" }}>
                      <input type="hidden" name="line_item_id" value={item.id} />
                      <input type="hidden" name="quantity" value={item.quantity - 1} />
                      <button type="submit" aria-label="Decrease quantity" style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.text, cursor: "pointer", fontSize: 16, fontWeight: 700, lineHeight: 1 }}>−</button>
                    </form>
                    <form action={updateLineItemAction} style={{ display: "inline" }}>
                      <input type="hidden" name="line_item_id" value={item.id} />
                      <input
                        type="number"
                        name="quantity"
                        min={1}
                        max={maxQty}
                        defaultValue={item.quantity}
                        onBlur={e => e.currentTarget.form?.requestSubmit()}
                        onKeyDown={e => e.key === "Enter" && e.currentTarget.form?.requestSubmit()}
                        style={{
                          width: 36, height: 28, textAlign: "center", fontWeight: 600, color: T.text,
                          border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13,
                        }}
                      />
                    </form>
                    <form action={updateLineItemAction} style={{ display: "inline" }}>
                      <input type="hidden" name="line_item_id" value={item.id} />
                      <input type="hidden" name="quantity" value={item.quantity + 1} />
                      <button
                        type="submit"
                        aria-label="Increase quantity"
                        disabled={atMax}
                        style={{
                          width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`,
                          background: "#fff", color: atMax ? T.textLight : T.text,
                          cursor: atMax ? "not-allowed" : "pointer", fontSize: 16, fontWeight: 700, lineHeight: 1,
                        }}
                      >+</button>
                    </form>
                  </div>
                  {/* Stock count intentionally hidden; the disabled + button enforces the max. */}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: T.text, fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{formatMoney(item.total, cur)}</div>
                  <form action={removeLineItemAction}>
                    <input type="hidden" name="line_item_id" value={item.id} />
                    <button type="submit" style={{ background: "none", border: "none", color: T.danger, fontSize: 13, cursor: "pointer", padding: "8px 8px", textDecoration: "underline", textUnderlineOffset: 2 }}>Remove</button>
                  </form>
                </div>
              </div>
              )
            })}
            <Link href="/shop" style={{ color: accent, textDecoration: "none", fontSize: 14, fontWeight: 600, marginTop: 4 }}>← Continue browsing</Link>
          </div>

          <div style={cardStyle}>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 17, marginBottom: 16 }}>Order Summary</div>
            <div style={rowStyle}><span>Subtotal</span><span style={{ color: T.text }}>{formatMoney(cart.subtotal, cur)}</span></div>
            <div style={rowStyle}>
              <span>Booking fee</span>
              <span style={{ color: cart.shipping_total === 0 ? T.success : T.text }}>{cart.shipping_total > 0 ? formatMoney(cart.shipping_total, cur) : "Free"}</span>
            </div>
            <div style={{ ...rowStyle, borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 14, fontWeight: 800, color: T.text, fontSize: 16 }}>
              <span>Total</span><span>{formatMoney(cart.total, cur)}</span>
            </div>
            <Link href="/checkout" style={{
              display: "block", textAlign: "center", marginTop: 20,
              background: accent, color: "#fff", textDecoration: "none",
              borderRadius: T.radiusSm, padding: "14px 24px", fontSize: 15, fontWeight: 700,
            }}>Proceed to Checkout →</Link>
            <div style={{ textAlign: "center", fontSize: 12, color: T.textLight, marginTop: 14 }}>🔒 Secure · E-tickets on email</div>
          </div>
        </div>
      </main>
      <EventpassFooter config={config} />
      <style>{`@media (max-width: 768px) { .ep-cart-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

/* ---- Checkout ---- */
export function EventpassCheckoutLivePage({ config, cart, cartCount, shippingOptions, countries, hasRazorpay, error, savedAddresses, customer }: CheckoutProps) {
  const accent = eventAccent(config)
  const storeName = config?.store_name ?? "EventPass"

  if (!cart || cart.items.length === 0) {
    return <EmptyShell config={config} icon="🛒" title="Your cart is empty" sub="Find an event and grab your tickets." />
  }

  const cur = cart.currency_code
  const addr = cart.shipping_address
  const hasAddress = Boolean(addr)
  const hasShipping = cart.shipping_methods.length > 0

  const Step = ({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: done ? T.success : active ? accent : T.border,
        color: done || active ? "#fff" : T.textLight,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
      }}>{done ? "✓" : n}</div>
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active || done ? T.text : T.textLight }}>{label}</span>
    </div>
  )

  const primaryBtn: React.CSSProperties = {
    background: accent, color: "#fff", border: "none",
    borderRadius: T.radiusSm, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
  }

  return (
    <div style={pageShell()}>
      <EventpassNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 40px 72px" }}>
        <Link href="/cart" style={{ fontSize: 13, color: T.textMuted, textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back to Cart</Link>
        <h1 style={{ color: T.text, fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, margin: "0 0 24px", letterSpacing: "-1px" }}>Checkout</h1>

        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <Step n={1} label="Contact" done={hasAddress} active={!hasAddress} />
          <span style={{ color: T.border }}>→</span>
          <Step n={2} label="Delivery" done={hasShipping} active={hasAddress && !hasShipping} />
          <span style={{ color: T.border }}>→</span>
          <Step n={3} label="Payment" done={false} active={hasAddress && hasShipping} />
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: T.radiusSm, padding: "12px 16px", color: T.danger, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div className="ep-checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Step 1: Contact details */}
            <div style={cardStyle} id="ep-address-section">
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{hasAddress ? "✓ " : "1. "}Contact Details</div>
              {savedAddresses && savedAddresses.length > 0 ? (
                <SavedAddressPicker addresses={savedAddresses} email={customer?.email ?? cart.email ?? ""} accent={config?.accent_color ?? eventAccent(config)} />
              ) : null}
              <form action={setAddressAction} className="ep-checkout-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={labelStyle}>First Name</label><input name="first_name" style={inputStyle} defaultValue={addr?.first_name ?? ""} required /></div>
                <div><label style={labelStyle}>Last Name</label><input name="last_name" style={inputStyle} defaultValue={addr?.last_name ?? ""} required /></div>
                <div><label style={labelStyle}>Email (e-tickets sent here)</label><input name="email" type="email" style={inputStyle} defaultValue={cart.email ?? ""} required /></div>
                <div><label style={labelStyle}>Phone</label><input name="phone" type="tel" style={inputStyle} defaultValue={addr?.phone ?? ""} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Address</label><input name="address_1" style={inputStyle} defaultValue={addr?.address_1 ?? ""} required /></div>
                <div><label style={labelStyle}>City</label><input name="city" style={inputStyle} defaultValue={addr?.city ?? ""} required /></div>
                <div><label style={labelStyle}>State / Province</label><input name="province" style={inputStyle} defaultValue={addr?.province ?? ""} /></div>
                <div><label style={labelStyle}>PIN Code</label><input name="postal_code" style={inputStyle} defaultValue={addr?.postal_code ?? ""} required /></div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <select name="country_code" style={inputStyle} defaultValue={addr?.country_code ?? (countries[0]?.iso_2 ?? "")} required>
                    <option value="" disabled>Select country</option>
                    {countries.map(c => <option key={c.iso_2} value={c.iso_2}>{c.display_name ?? c.iso_2.toUpperCase()}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <SubmitButton style={{ ...primaryBtn, width: "100%" }} pendingLabel="Saving…">Save &amp; Continue</SubmitButton>
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    <SaveAndAdvance nextSectionId="ep-delivery-section" label="Address saved" style={{ marginLeft: 0 }} />
                  </div>
                </div>
              </form>
            </div>

            {/* Step 2: Delivery */}
            <div style={cardStyle} id="ep-delivery-section">
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{hasShipping ? "✓ " : "2. "}Delivery Method</div>
              {!hasAddress ? (
                <p style={{ color: T.textMuted, fontSize: 14, margin: 0 }}>Enter your contact details to see delivery options.</p>
              ) : shippingOptions.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: 14, margin: 0 }}>No delivery options are available.</p>
              ) : (
                <form action={setShippingMethodAction}>
                  {shippingOptions.map(option => (
                    <label key={option.id} style={{ ...rowStyle, cursor: "pointer" }}>
                      <span style={{ color: T.text }}><input type="radio" name="option_id" value={option.id} required defaultChecked={cart.shipping_methods.some(m => m.name === option.name)} /> {option.name}</span>
                      <span style={{ color: T.text }}>{formatMoney(option.amount ?? 0, cur)}</span>
                    </label>
                  ))}
                  <SubmitButton style={{ ...primaryBtn, background: "#fff", color: T.text, border: `1px solid ${T.border}`, marginTop: 12 }} pendingLabel="Saving…">Use this method</SubmitButton>
                  <SaveAndAdvance nextSectionId="ep-payment-section" label="Delivery method saved" />
                </form>
              )}
            </div>

            {/* Step 3: Payment */}
            <div style={cardStyle} id="ep-payment-section">
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>3. Payment</div>
              {hasAddress && hasShipping ? (
                hasRazorpay ? (
                  <RazorpayCheckout storeName={storeName} accentColor={config?.accent_color ?? undefined} email={cart.email} />
                ) : (
                  <form action={placeOrderAction}><SubmitButton style={{ ...primaryBtn, width: "100%" }} pendingLabel="Placing order…">Place Order</SubmitButton></form>
                )
              ) : (
                <p style={{ color: T.textMuted, fontSize: 14, margin: 0 }}>Complete the steps above to pay.</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div style={cardStyle}>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 17, marginBottom: 16 }}>Your Order</div>
            {cart.items.map(item => (
              <div key={item.id} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: T.radiusSm, overflow: "hidden", background: T.bgSubtle, flexShrink: 0 }}>
                  {item.thumbnail && <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.product_title ?? item.title}</div>
                  <div style={{ fontSize: 12, color: T.textLight }}>Qty {item.quantity}{item.variant_title ? ` · ${item.variant_title}` : ""}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, flexShrink: 0 }}>{formatMoney(item.total, cur)}</div>
              </div>
            ))}
            <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "16px 0" }} />
            <div style={rowStyle}><span>Subtotal</span><span style={{ color: T.text }}>{formatMoney(cart.subtotal, cur)}</span></div>
            <div style={rowStyle}>
              <span>Booking fee</span>
              <span style={{ color: cart.shipping_total === 0 ? T.success : T.text }}>{cart.shipping_total > 0 ? formatMoney(cart.shipping_total, cur) : "Free"}</span>
            </div>
            <div style={{ ...rowStyle, fontWeight: 800, color: T.text, fontSize: 16 }}><span>Total</span><span>{formatMoney(cart.total, cur)}</span></div>
          </div>
        </div>
      </main>
      <EventpassFooter config={config} />
      <style>{`@media (max-width: 768px) { .ep-checkout-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 480px) { .ep-checkout-form { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

/* ---- Order confirmation ---- */
export function EventpassOrderLivePage({ config, cartCount, order }: OrderProps) {
  const accent = eventAccent(config)
  const cur = order.currency_code

  return (
    <div style={pageShell()}>
      <EventpassNav config={config} cartCount={cartCount} hasDeals={false} categories={[]} />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 40px 72px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", background: T.accentLight,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            margin: "0 auto 20px",
          }}>🎟️</div>
          <h1 style={{ color: T.text, fontSize: 32, fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.5px" }}>Booking Confirmed!</h1>
          <p style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            {order.email ? `Your e-tickets have been sent to ${order.email}. ` : "Your e-tickets are on their way. "}
            Show the QR at the venue — that&apos;s all you need.
          </p>
        </div>

        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Booking Details</div>
          <div style={rowStyle}><span>Booking ID</span><strong style={{ color: T.text }}>#{order.display_id}</strong></div>
          {order.email && <div style={rowStyle}><span>Email</span><strong style={{ color: T.text }}>{order.email}</strong></div>}
        </div>

        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Your Tickets</div>
          {order.items.map(item => (
            <div key={item.id} style={rowStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {item.thumbnail && <img src={item.thumbnail} alt="" width={40} height={40} style={{ borderRadius: T.radiusSm, objectFit: "cover", flexShrink: 0 }} />}
                <span>
                  {item.handle ? <Link href={`/products/${item.handle}`} style={{ color: "inherit" }}>{item.title}</Link> : item.title} × {item.quantity}
                </span>
              </span>
              <strong style={{ color: T.text }}>{formatMoney(item.total, cur)}</strong>
            </div>
          ))}
          <div style={{ ...rowStyle, borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 14, fontWeight: 800, color: T.text, fontSize: 16 }}>
            <span>Total</span><strong>{formatMoney(order.total, cur)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/" style={{ background: "#fff", color: T.text, textDecoration: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "12px 24px", fontSize: 14, fontWeight: 700 }}>Back to Home</Link>
          <Link href="/shop" style={{ background: accent, color: "#fff", textDecoration: "none", borderRadius: T.radiusSm, padding: "12px 24px", fontSize: 14, fontWeight: 700 }}>Browse More Events</Link>
        </div>
      </main>
      <EventpassFooter config={config} />
    </div>
  )
}
