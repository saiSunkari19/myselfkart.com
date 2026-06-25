/**
 * A cart's shipping_address is considered "set" only when the buyer has actually
 * filled the deliverable fields. Medusa pre-creates an EMPTY shipping_address
 * object (just the region's country_code) when a cart is made, so a plain
 * `Boolean(cart.shipping_address)` truthiness check passes even when nothing has
 * been entered — which let orders through with a blank address (no name/street/
 * city/pin) and silently broke fulfilment (Shiprocket push skipped). Gate on
 * completeness instead, everywhere a cart is gated for checkout.
 */
export function isCompleteShippingAddress(
  a?:
    | {
        first_name?: string | null
        address_1?: string | null
        city?: string | null
        postal_code?: string | null
      }
    | null
): boolean {
  return Boolean(
    a?.first_name?.trim() &&
      a?.address_1?.trim() &&
      a?.city?.trim() &&
      a?.postal_code?.trim()
  )
}
