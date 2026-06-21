import Link from "next/link"

import { formatMoney } from "../../../lib/format"
import type { CustomerOrderListItem } from "../../../lib/views"
import { OrderStatusBadge } from "./order-status-badge"

/** Theme-agnostic order history list. Links each order to its detail page. */
export function OrdersList({ orders }: { orders: CustomerOrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 16px", color: "#78716c" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
        <p style={{ margin: "0 0 16px", fontSize: 15 }}>You haven&apos;t placed any orders yet.</p>
        <Link href="/shop" style={{ fontSize: 14, fontWeight: 600, color: "#1c1917" }}>
          Start shopping →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/order/${order.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            border: "1px solid #e7e5e4",
            borderRadius: 12,
            padding: 16,
            textDecoration: "none",
            color: "inherit",
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {order.thumbnails.length > 0 ? (
              order.thumbnails.slice(0, 2).map((src, i) => (
                <div key={i} style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", background: "#f5f5f4" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f5f5f4" }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1c1917" }}>Order #{order.display_id}</span>
              <OrderStatusBadge order={order} />
            </div>
            <div style={{ fontSize: 12.5, color: "#78716c" }}>
              {order.created_at ? new Date(order.created_at).toLocaleDateString() : ""}
              {" · "}
              {order.item_count} item{order.item_count !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1c1917", flexShrink: 0 }}>
            {formatMoney(order.total, order.currency_code)}
          </div>
        </Link>
      ))}
    </div>
  )
}
