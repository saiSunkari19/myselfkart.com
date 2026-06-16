import { addToCartAction } from "../lib/cart/actions"
import { formatMoney } from "../lib/format"
import type { StoreVariant } from "../lib/medusa/products"

/**
 * Server-rendered add-to-cart form. Posts to the addToCartAction server action,
 * which signs the tenant headers server-side — the browser never carries tenant
 * context. If the product has multiple variants, a selector is shown.
 */
export function AddToCart({ variants }: { variants: StoreVariant[] }) {
  const sellable = variants.filter((v) => v.calculated_price?.calculated_amount != null)

  if (sellable.length === 0) {
    return <p className="state">Not available for purchase.</p>
  }

  return (
    <form action={addToCartAction} className="add-to-cart">
      {sellable.length === 1 ? (
        <input type="hidden" name="variant_id" value={sellable[0].id} />
      ) : (
        <select name="variant_id" aria-label="Variant">
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
      <input
        type="number"
        name="quantity"
        defaultValue={1}
        min={1}
        aria-label="Quantity"
        style={{ width: "4rem" }}
      />
      <button type="submit">Add to cart</button>
    </form>
  )
}
