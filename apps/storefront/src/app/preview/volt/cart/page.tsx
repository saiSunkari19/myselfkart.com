"use client"

import { useState } from "react"
import Link from "next/link"
import { PageShell, ProductCard, Reveal } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const INIT = [
  { product: PRODUCTS[0], qty: 1, storage: "256GB" },
  { product: PRODUCTS[3], qty: 1, storage: "" },
]

export default function CartPage() {
  const [cart, setCart] = useState(INIT)
  const [promo, setPromo] = useState("")
  const updateQty = (i: number, d: number) => setCart(prev => {
    const next = [...prev]
    const q = next[i].qty + d
    if (q < 1) return next.filter((_, idx) => idx !== i)
    next[i] = { ...next[i], qty: q }
    return next
  })
  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  if (!cart.length) return (
    <PageShell>
      <div className={s.container}>
        <div className={s.emptyState}>
          <div className={s.emptyStateIcon}>🛒</div>
          <div className={s.emptyStateTitle}>Your cart is empty</div>
          <p className={s.emptyStateText} style={{ marginBottom: 20 }}>Add items to get started</p>
          <Link href="/preview/volt/shop" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Start Shopping</Link>
        </div>
      </div>
    </PageShell>
  )

  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderTitle}>Shopping Cart</div>
          <div className={s.pageHeaderSub}>{cart.length} item{cart.length !== 1 ? "s" : ""} in your cart</div>
        </div>
      </div>
      <div className={s.container}>
        <div className={s.cartLayout}>
          <div>
            {cart.map((item, i) => (
              <div key={i} className={s.cartItem}>
                <Link href={`/preview/volt/products/${item.product.id}`} className={s.cartItemImg}>
                  <img src={item.product.image} alt={item.product.name} />
                </Link>
                <div>
                  <div className={s.cartItemBrand}>{item.product.brand}</div>
                  <div className={s.cartItemName}>{item.product.name}</div>
                  {item.storage && <div className={s.cartItemMeta}>Storage: {item.storage}</div>}
                  <div className={s.cartItemMeta}>Warranty: {item.product.warranty}</div>
                  <div className={s.cartItemMeta} style={{ color: "var(--success)" }}>🚚 {item.product.delivery}</div>
                  <div className={s.qtyControl} style={{ marginTop: 10 }}>
                    <button className={s.qtyBtn} onClick={() => updateQty(i, -1)}>−</button>
                    <span className={s.qtyVal}>{item.qty}</span>
                    <button className={s.qtyBtn} onClick={() => updateQty(i, +1)}>+</button>
                  </div>
                </div>
                <div className={s.cartItemPrice}>
                  <div className={s.priceMain}>₹{(item.product.price * item.qty).toLocaleString("en-IN")}</div>
                  {item.product.originalPrice && (
                    <div className={s.priceOriginal} style={{ textAlign: "right" }}>₹{(item.product.originalPrice * item.qty).toLocaleString("en-IN")}</div>
                  )}
                  {item.product.discount && (
                    <div className={s.priceDiscount} style={{ textAlign: "right" }}>{item.product.discount}% off</div>
                  )}
                  <button className={s.removeBtn} onClick={() => updateQty(i, -item.qty)}>Remove</button>
                </div>
              </div>
            ))}
            <Link href="/preview/volt/shop" className={`${s.btn} ${s.btnSecondary}`} style={{ marginTop: 8 }}>← Continue Shopping</Link>
          </div>
          <div className={s.orderSummary}>
            <div className={s.orderSummaryTitle}>Order Summary</div>
            <div className={s.summaryRow}><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            <div className={s.summaryRow}><span>Shipping</span><span style={{ color: shipping === 0 ? "var(--success)" : undefined }}>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
            {shipping > 0 && <div style={{ fontSize: 11.5, color: "var(--text3)", background: "var(--bg3)", padding: "8px 10px", borderRadius: 6 }}>Add ₹{(999 - subtotal).toLocaleString("en-IN")} more for free shipping</div>}
            <div className={s.promoRow}>
              <input className={s.promoInput} placeholder="Coupon Code" value={promo} onChange={e => setPromo(e.target.value)} />
              <button className={s.promoBtn}>Apply</button>
            </div>
            <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
            <Link href="/preview/volt/checkout" className={`${s.btn} ${s.btnPrimary} ${s.btnFull} ${s.btnLg}`} style={{ marginTop: 16, display: "flex" }}>Proceed to Checkout</Link>
            <div className={s.secureNote}>🔒 100% Secure · SSL Encrypted</div>
          </div>
        </div>

        <Reveal>
          <section className={s.section}>
            <div className={s.sectionHead}>
              <div className={s.sectionTitle}>You May Also Like</div>
            </div>
            <div className={s.productGrid}>
              {PRODUCTS.slice(4, 8).map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}><ProductCard product={p} /></Reveal>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </PageShell>
  )
}
