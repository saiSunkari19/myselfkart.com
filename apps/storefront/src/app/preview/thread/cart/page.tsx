"use client"

import { useState } from "react"
import Link from "next/link"
import { PageShell } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const INITIAL_CART = [
  { product: PRODUCTS[0], size: "M", color: "Sand", qty: 1 },
  { product: PRODUCTS[6], size: "M/L", color: "Camel", qty: 1 },
]

export default function CartPage() {
  const [cart, setCart] = useState(INITIAL_CART)
  const [promo, setPromo] = useState("")

  const updateQty = (i: number, delta: number) => {
    setCart(prev => {
      const next = [...prev]
      const newQty = next[i].qty + delta
      if (newQty < 1) return next.filter((_, idx) => idx !== i)
      next[i] = { ...next[i], qty: newQty }
      return next
    })
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  const shipping = subtotal >= 2999 ? 0 : 199
  const total = subtotal + shipping

  if (cart.length === 0) {
    return (
      <PageShell>
        <div className={s.container}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>🛍️</div>
            <h2 className={s.emptyTitle}>Your bag is empty</h2>
            <p className={s.emptyText}>Looks like you haven't added anything yet.</p>
            <Link href="/preview/thread/products" className={s.btn}>Start Shopping</Link>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.pageTitle}>
          <div className={s.pageTitleLabel}>Your Bag</div>
          <h1 className={s.pageTitleText}>Shopping Bag</h1>
          <p className={s.pageTitleSub}>{cart.reduce((s, i) => s + i.qty, 0)} item{cart.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""}</p>
        </div>

        <div className={s.cartLayout}>
          {/* Items */}
          <div>
            {cart.map((item, i) => (
              <div key={i} className={s.cartItem}>
                <Link href={`/preview/thread/products/${item.product.id}`} className={s.cartItemImg}>
                  <img src={item.product.image} alt={item.product.name} />
                </Link>
                <div>
                  <Link
                    href={`/preview/thread/products/${item.product.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div className={s.cartItemName}>{item.product.name}</div>
                  </Link>
                  <div className={s.cartItemMeta}>
                    Size: {item.size} · Colour: {item.color}
                  </div>
                  <div className={s.qtyRow}>
                    <button className={s.qtyBtn} onClick={() => updateQty(i, -1)}>−</button>
                    <span className={s.qtyVal}>{item.qty}</span>
                    <button className={s.qtyBtn} onClick={() => updateQty(i, +1)}>+</button>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 8 }}>
                    ₹{(item.product.price * item.qty).toLocaleString()}
                  </div>
                  <button className={s.removeBtn} onClick={() => updateQty(i, -item.qty)}>Remove</button>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <div style={{ marginTop: 28 }}>
              <Link href="/preview/thread/products" className={`${s.btn} ${s.btnOutline}`}>← Continue Shopping</Link>
            </div>
          </div>

          {/* Summary */}
          <div className={s.orderSummary}>
            <div className={s.orderSummaryTitle}>Order Summary</div>

            <div className={s.summaryRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className={s.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: shipping === 0 ? "#22c55e" : undefined }}>
                {shipping === 0 ? "Free" : `₹${shipping}`}
              </span>
            </div>
            {shipping > 0 && (
              <div style={{
                background: "#fdf5ee", border: "1px solid #e8d4b8", borderRadius: 8,
                padding: "10px 14px", fontSize: 12, color: "#a07850", marginTop: 8,
              }}>
                Add ₹{(2999 - subtotal).toLocaleString()} more for free shipping
              </div>
            )}

            <div className={s.promoRow}>
              <input
                className={s.promoInput}
                placeholder="Promo code"
                value={promo}
                onChange={e => setPromo(e.target.value)}
              />
              <button className={s.promoBtn}>Apply</button>
            </div>

            <div className={`${s.summaryRow} ${s.summaryRowTotal}`}>
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            <Link href="/preview/thread/checkout" className={`${s.btn} ${s.btnFull}`} style={{ marginTop: 20, display: "flex" }}>
              Proceed to Checkout →
            </Link>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
              {["💳 Secure", "🔒 Encrypted", "↩️ Easy returns"].map(t => (
                <span key={t} style={{ fontSize: 11, color: "#a09890" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
