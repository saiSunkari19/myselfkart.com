import Link from "next/link"
import { notFound } from "next/navigation"

import { formatMoney } from "../../../lib/format"
import { getTenantOrder } from "../../../lib/medusa/order"
import { resolveTenant } from "../../../lib/tenant/resolve-tenant"

export const dynamic = "force-dynamic"

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await resolveTenant()

  // RLS scopes the order to the tenant: another tenant's order id is not found
  // under this host, so it 404s rather than leaking.
  if (!tenant || tenant.status !== "active") {
    notFound()
  }

  const order = await getTenantOrder(tenant, id)
  if (!order) {
    notFound()
  }

  return (
    <main>
      <h1>Thank you for your order</h1>
      <p>
        Order <strong>#{order.display_id}</strong> is confirmed
        {order.email ? ` — a receipt will go to ${order.email}` : ""}.
      </p>

      <ul className="order-lines">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity} × {item.title} —{" "}
            {formatMoney(item.total, order.currency_code)}
          </li>
        ))}
      </ul>

      <p className="order-total">
        <strong>Total: {formatMoney(order.total, order.currency_code)}</strong>
      </p>

      <p>
        <Link href="/">← Continue shopping</Link>
      </p>
    </main>
  )
}
