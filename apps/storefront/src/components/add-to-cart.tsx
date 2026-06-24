"use client"

import { useState } from "react"

import { addToCartAction } from "../lib/cart/actions"
import { formatMoney } from "../lib/format"
import type { StoreVariant } from "../lib/medusa/products"

/**
 * Per-theme class hooks. Themes pass their CSS-module class strings so the one
 * shared (functional) form renders in each theme's skin. All optional — omit
 * them and the form renders plain-but-working (DefaultTheme fallback).
 */
export type AddToCartClasses = {
  form?: string
  select?: string
  qtyRow?: string
  qty?: string
  qtyBtn?: string
  qtyVal?: string
  actions?: string
  primary?: string
  secondary?: string
}

/**
 * Server-action add-to-cart form, skinnable per theme. Posts to addToCartAction
 * (which signs tenant headers server-side — the browser never carries tenant
 * context). Renders a variant selector (when >1 sellable variant), a quantity
 * stepper, an "Add to cart" submit, and an optional "Buy Now" submit that adds
 * the item and routes straight to checkout. `stockLabel` sits beside the
 * stepper; `footer` renders after the buttons (e.g. trust chips).
 */
export function AddToCart({
  variants,
  classes = {},
  buyNow = false,
  stockLabel,
  footer,
}: {
  variants: StoreVariant[]
  classes?: AddToCartClasses
  buyNow?: boolean
  stockLabel?: React.ReactNode
  footer?: React.ReactNode
}) {
  const sellable = variants.filter((v) => v.calculated_price?.calculated_amount != null)
  const [variantId, setVariantId] = useState(sellable[0]?.id ?? "")
  const [quantity, setQuantity] = useState(1)

  if (sellable.length === 0) {
    return <p className="state">Not available for purchase.</p>
  }

  return (
    <form action={addToCartAction} className={classes.form ?? "add-to-cart"}>
      {/* The selected variant + quantity ride as hidden fields so the server
          action sees them regardless of which submit button is clicked. */}
      <input type="hidden" name="variant_id" value={variantId} />
      <input type="hidden" name="quantity" value={quantity} />

      {sellable.length > 1 && (
        <select
          aria-label="Variant"
          className={classes.select}
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
        >
          {sellable.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title ?? "Variant"} —{" "}
              {formatMoney(
                v.calculated_price?.calculated_amount,
                v.calculated_price?.currency_code
              )}
            </option>
          ))}
        </select>
      )}

      <div className={classes.qtyRow}>
        <div className={classes.qty}>
          <button
            type="button"
            className={classes.qtyBtn}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className={classes.qtyVal}>{quantity}</span>
          <button
            type="button"
            className={classes.qtyBtn}
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {stockLabel}
      </div>

      <div className={classes.actions}>
        <button type="submit" className={classes.primary}>
          Add to cart
        </button>
        {buyNow && (
          // `buy_now` flips addToCartAction's redirect from /cart to /checkout.
          <button type="submit" name="buy_now" value="1" className={classes.secondary}>
            Buy Now
          </button>
        )}
      </div>

      {footer}
    </form>
  )
}
