import Link from "next/link"

import {
  removeLineItemAction,
  updateLineItemAction,
} from "../../lib/cart/actions"
import { getCartId } from "../../lib/cart/cookie"
import { formatMoney } from "../../lib/format"
import { getCart } from "../../lib/medusa/cart"
import { resolveTenant } from "../../lib/tenant/resolve-tenant"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") {
    return (
      <main>
        <p className="state">This store could not be found.</p>
      </main>
    )
  }

  const cartId = await getCartId()
  const cart = cartId ? await getCart(tenant, cartId) : null

  if (!cart || cart.items.length === 0) {
    return (
      <main>
        <h1>Your cart</h1>
        <p className="state">Your cart is empty.</p>
        <p>
          <Link href="/">← Continue shopping</Link>
        </p>
      </main>
    )
  }

  return (
    <main>
      <h1>Your cart</h1>
      <ul className="cart-lines">
        {cart.items.map((item) => (
          <li key={item.id} className="cart-line">
            {item.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.thumbnail} alt={item.title} width={64} height={64} />
            ) : null}
            <div className="cart-line-info">
              <strong>{item.product_title ?? item.title}</strong>
              {item.variant_title ? <span>{item.variant_title}</span> : null}
              <span>{formatMoney(item.unit_price, cart.currency_code)} each</span>
            </div>
            <form action={updateLineItemAction} className="cart-line-qty">
              <input type="hidden" name="line_item_id" value={item.id} />
              <input
                type="number"
                name="quantity"
                defaultValue={item.quantity}
                min={1}
                aria-label="Quantity"
                style={{ width: "4rem" }}
              />
              <button type="submit">Update</button>
            </form>
            <span className="cart-line-total">
              {formatMoney(item.total, cart.currency_code)}
            </span>
            <form action={removeLineItemAction}>
              <input type="hidden" name="line_item_id" value={item.id} />
              <button type="submit">Remove</button>
            </form>
          </li>
        ))}
      </ul>

      <dl className="cart-totals">
        <dt>Subtotal</dt>
        <dd>{formatMoney(cart.subtotal, cart.currency_code)}</dd>
        <dt>Total</dt>
        <dd>{formatMoney(cart.total, cart.currency_code)}</dd>
      </dl>

      <p>
        <Link href="/checkout">Proceed to checkout →</Link>
      </p>
    </main>
  )
}
