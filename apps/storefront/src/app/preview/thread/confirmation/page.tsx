"use client"

import Link from "next/link"
import { PageShell } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const ORDER_ID = "THR-2026-8847"
const ORDER_ITEMS = [
  { product: PRODUCTS[0], size: "M", qty: 1 },
  { product: PRODUCTS[6], size: "M/L", qty: 1 },
]
const subtotal = ORDER_ITEMS.reduce((sum, i) => sum + i.product.price * i.qty, 0)
const shipping = 0
const total = subtotal + shipping

export default function ConfirmationPage() {
  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.confirmationWrap}>
          <div className={s.confirmationIcon}>✅</div>
          <h1 className={s.confirmationTitle}>Order Placed!</h1>
          <p className={s.confirmationSub}>
            Thank you for your order. We've sent a confirmation email to your inbox.
            Your pieces are being prepared with care.
          </p>

          <div className={s.orderCard}>
            <div className={s.orderCardTitle}>Order Details</div>
            <div className={s.orderCardRow}>
              <span>Order ID</span>
              <strong>{ORDER_ID}</strong>
            </div>
            <div className={s.orderCardRow}>
              <span>Date</span>
              <strong>19 June 2026</strong>
            </div>
            <div className={s.orderCardRow}>
              <span>Estimated Delivery</span>
              <strong>23–25 June 2026</strong>
            </div>
            <div className={s.orderCardRow}>
              <span>Payment</span>
              <strong>Card ending in ••••3456</strong>
            </div>
          </div>

          <div className={s.orderCard}>
            <div className={s.orderCardTitle}>Items Ordered</div>
            {ORDER_ITEMS.map((item, i) => (
              <div key={i} className={s.orderCardRow}>
                <span>{item.product.name} (Size {item.size}) × {item.qty}</span>
                <strong>₹{(item.product.price * item.qty).toLocaleString()}</strong>
              </div>
            ))}
            <div className={s.orderCardRow}>
              <span>Shipping</span>
              <strong style={{ color: "#22c55e" }}>Free</strong>
            </div>
            <div className={s.orderCardRow} style={{ fontWeight: 700 }}>
              <span style={{ color: "#1a1a1a", fontWeight: 700 }}>Total</span>
              <strong>₹{total.toLocaleString()}</strong>
            </div>
          </div>

          {/* Delivery steps */}
          <div style={{
            background: "#f2efe9", borderRadius: 14, padding: 24,
            display: "flex", flexDirection: "column", gap: 16, marginBottom: 32, textAlign: "left",
          }}>
            {[
              { icon: "✅", label: "Order Confirmed", done: true },
              { icon: "📦", label: "Being Packed", done: false },
              { icon: "🚚", label: "Out for Delivery", done: false },
              { icon: "🏠", label: "Delivered", done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: step.done ? "#22c55e" : "#e8e4df",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                }}>
                  {step.done ? "✓" : "○"}
                </div>
                <span style={{ fontSize: 14, color: step.done ? "#1a1a1a" : "#a09890", fontWeight: step.done ? 600 : 400 }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/preview/thread" className={`${s.btn} ${s.btnOutline}`}>Back to Home</Link>
            <Link href="/preview/thread/products" className={s.btn}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
