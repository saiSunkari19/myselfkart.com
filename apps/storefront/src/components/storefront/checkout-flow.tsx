"use client"

import Link from "next/link"

import {
  placeOrderAction,
  setAddressAction,
  setShippingMethodAction,
} from "../../lib/cart/actions"
import { formatMoney } from "../../lib/format"
import { isCompleteShippingAddress } from "../../lib/cart/address"
import { RazorpayCheckout } from "../razorpay-checkout"
import { SavedAddressPicker } from "./account/saved-address-picker"
import type { CartView, ShippingOptionView, CustomerAddressView } from "../../lib/views"

/**
 * Theme-agnostic checkout flow — address → shipping → review/pay. The Razorpay
 * modal and the `setAddressAction` / `setShippingMethodAction` / `placeOrderAction`
 * server actions are preserved exactly; themes only provide the surrounding chrome.
 */
export function CheckoutFlow({
  cart,
  shippingOptions,
  countries,
  hasRazorpay,
  error,
  savedAddresses = [],
  customerEmail,
  accent,
}: {
  cart: CartView | null
  shippingOptions: ShippingOptionView[]
  countries: { iso_2: string; display_name?: string | null }[]
  hasRazorpay: boolean
  error?: string | null
  savedAddresses?: CustomerAddressView[]
  customerEmail?: string | null
  accent?: string
}) {
  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-empty">
        <h1>Checkout</h1>
        <p className="state">Your cart is empty.</p>
        <p>
          <Link href="/">← Continue shopping</Link>
        </p>
      </div>
    )
  }

  const hasAddress = isCompleteShippingAddress(cart.shipping_address)
  const hasShipping = cart.shipping_methods.length > 0
  const addr = cart.shipping_address

  return (
    <div className="checkout">
      <h1>Checkout</h1>
      {error ? <p className="state error">{error}</p> : null}

      {/* Step 1: contact + shipping address */}
      <section>
        <h2>1. Shipping details</h2>
        {savedAddresses.length > 0 ? (
          <SavedAddressPicker
            addresses={savedAddresses}
            email={customerEmail ?? cart.email ?? ""}
            accent={accent}
          />
        ) : null}
        <form action={setAddressAction} className="address-form">
          <input name="email" type="email" placeholder="Email" required defaultValue={cart.email ?? ""} />
          <input name="first_name" placeholder="First name" required defaultValue={addr?.first_name ?? ""} />
          <input name="last_name" placeholder="Last name" required defaultValue={addr?.last_name ?? ""} />
          <input name="address_1" placeholder="Address line 1 — house no., building, street" required defaultValue={addr?.address_1 ?? ""} />
          <input name="address_2" placeholder="Address line 2 — area, locality, landmark (optional)" defaultValue={addr?.address_2 ?? ""} />
          <input name="city" placeholder="City" required defaultValue={addr?.city ?? ""} />
          <input name="province" placeholder="State / Province" defaultValue={addr?.province ?? ""} />
          <input name="postal_code" placeholder="Postal code" required defaultValue={addr?.postal_code ?? ""} />
          <select name="country_code" required defaultValue={addr?.country_code ?? (countries[0]?.iso_2 ?? "")}>
            <option value="" disabled>
              Select country
            </option>
            {countries.map((c) => (
              <option key={c.iso_2} value={c.iso_2}>
                {c.display_name ?? c.iso_2.toUpperCase()}
              </option>
            ))}
          </select>
          <input name="phone" placeholder="Phone" defaultValue={addr?.phone ?? ""} />
          <button type="submit">Save details</button>
        </form>
      </section>

      {/* Step 2: shipping method */}
      <section>
        <h2>2. Shipping method</h2>
        {!hasAddress ? (
          <p className="state">Enter your shipping details to see delivery options.</p>
        ) : shippingOptions.length === 0 ? (
          <p className="state">No delivery options are available for this address.</p>
        ) : (
          <form action={setShippingMethodAction} className="shipping-form">
            {shippingOptions.map((option) => (
              <label key={option.id} className="shipping-option">
                <input
                  type="radio"
                  name="option_id"
                  value={option.id}
                  defaultChecked={cart.shipping_methods.some((m) => m.name === option.name)}
                  required
                />
                {option.name} — {formatMoney(option.amount ?? 0, cart.currency_code)}
              </label>
            ))}
            <button type="submit">Use this method</button>
          </form>
        )}
      </section>

      {/* Step 3: review + place order */}
      <section>
        <h2>3. Review</h2>
        <dl className="cart-totals">
          <dt>Subtotal</dt>
          <dd>{formatMoney(cart.subtotal, cart.currency_code)}</dd>
          <dt>Shipping</dt>
          <dd>{formatMoney(cart.shipping_total, cart.currency_code)}</dd>
          <dt>Total</dt>
          <dd>{formatMoney(cart.total, cart.currency_code)}</dd>
        </dl>

        {hasAddress && hasShipping ? (
          hasRazorpay ? (
            <RazorpayCheckout storeName="Online Store" email={cart.email} />
          ) : (
            <form action={placeOrderAction}>
              <button type="submit">Place order</button>
            </form>
          )
        ) : (
          <p className="state">Complete the steps above to place your order.</p>
        )}
      </section>

      <p>
        <Link href="/cart">← Back to cart</Link>
      </p>
    </div>
  )
}
