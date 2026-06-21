"use client"

import Link from "next/link"

import { formatMoney } from "../../lib/format"
import type { OrderView } from "../../lib/views"

/** Theme-agnostic order confirmation. Themes wrap this in their chrome. */
export function OrderSummary({ order }: { order: OrderView }) {
  return (
    <div className="order-confirmation">
      <h1>Thank you for your order</h1>
      <p>
        Order <strong>#{order.display_id}</strong> is confirmed
        {order.email ? ` — a receipt will go to ${order.email}` : ""}.
      </p>

      <ul className="order-lines">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity} × {item.title} — {formatMoney(item.total, order.currency_code)}
          </li>
        ))}
      </ul>

      <p className="order-total">
        <strong>Total: {formatMoney(order.total, order.currency_code)}</strong>
      </p>

      <p>
        <Link href="/">← Continue shopping</Link>
      </p>
    </div>
  )
}
