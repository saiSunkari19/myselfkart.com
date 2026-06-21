import type { CSSProperties } from "react"

import type { CustomerOrderListItem } from "../../../lib/views"

/**
 * Derives a single human label + colour for an order from Medusa's separate
 * status fields (order status, fulfillment, payment). Cancelled wins, then
 * fulfillment progress, then payment.
 */
export function deriveOrderStatus(order: {
  status?: string | null
  fulfillment_status?: string | null
  payment_status?: string | null
}): { label: string; color: string; bg: string } {
  const s = order.status ?? ""
  const f = order.fulfillment_status ?? ""
  const p = order.payment_status ?? ""

  if (s === "canceled" || f === "canceled") return { label: "Cancelled", color: "#b91c1c", bg: "#fef2f2" }
  if (f === "delivered") return { label: "Delivered", color: "#15803d", bg: "#f0fdf4" }
  if (f === "shipped" || f === "partially_shipped") return { label: "Shipped", color: "#1d4ed8", bg: "#eff6ff" }
  if (f === "fulfilled" || f === "partially_fulfilled") return { label: "Processing", color: "#a16207", bg: "#fefce8" }
  if (p === "captured") return { label: "Confirmed", color: "#15803d", bg: "#f0fdf4" }
  if (p === "not_paid" || p === "awaiting") return { label: "Payment pending", color: "#a16207", bg: "#fefce8" }
  if (s === "completed") return { label: "Completed", color: "#15803d", bg: "#f0fdf4" }
  return { label: "Placed", color: "#57534e", bg: "#f5f5f4" }
}

export function OrderStatusBadge({ order }: { order: Pick<CustomerOrderListItem, "status" | "fulfillment_status" | "payment_status"> }) {
  const { label, color, bg } = deriveOrderStatus(order)
  const style: CSSProperties = {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    color,
    background: bg,
    borderRadius: 999,
    padding: "3px 10px",
    whiteSpace: "nowrap",
  }
  return <span style={style}>{label}</span>
}
