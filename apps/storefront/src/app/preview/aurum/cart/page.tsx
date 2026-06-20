"use client"

import { useState } from "react"
import Link from "next/link"
import { PageShell, ProductCard, Reveal } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const INITIAL = [
  { product: PRODUCTS[1], size: "8", qty: 1 },
  { product: PRODUCTS[3], size: "", qty: 1 },
]

export default function CartPage() {
  const [cart, setCart] = useState(INITIAL)
  const [promo, setPromo] = useState("")

  const updateQty = (i: number, delta: number) => {
    setCart(prev => {
      const next = [...prev]
      const q = next[i].qty + delta
      if (q < 1) return next.filter((_, idx) => idx !== i)
      next[i] = { ...next[i], qty: q }
      return next
    })
  }

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const shipping = subtotal >= 10000 ? 0 : 299
  const total = subtotal + shipping

  if (cart.length === 0) return (
    <PageShell>
      <div className={s.container}>
        <div className={s.emptyState} style={{ padding: "120px 0" }}>
          <div className={s.emptyIcon}>◇</div>
          <div className={s.emptyTitle}>Your bag is empty</div>
          <p className={s.emptyText}>Add a piece to your bag to begin your journey.</p>
          <Link href="/preview/aurum/shop" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>Explore Collection</Link>
        </div>
      </div>
    </PageShell>
  )

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.pageHeader} style={{ textAlign: "left", padding: "60px 0 40px", marginBottom: 0 }}>
          <div className={s.pageHeaderLabel}>Your Selection</div>
          <h1 className={s.pageHeaderTitle} style={{ textAlign: "left" }}>Shopping Bag</h1>
        </div>

        <div className={s.cartLayout}>
          {/* Items */}
          <div>
            {cart.map((item, i) => (
              <div key={i} className={s.cartItem}>
                <Link href={`/preview/aurum/products/${item.product.id}`} className={s.cartItemImg}>
                  <img src={item.product.image} alt={item.product.name} />
                </Link>
                <div>
                  <div className={s.cartItemName}>{item.product.name}</div>
                  <div className={s.cartItemMeta}>{item.product.metal}{item.product.stone ? ` · ${item.product.stone}` : ""}</div>
                  {item.size && <div className={s.cartItemMeta}>Size: {item.size}</div>}
                  {item.product.certified && <div className={s.cartItemCert}>✦ Certified · {item.product.purity || "18K Hallmarked"}</div>}
                  <div className={s.qtyRow}>
                    <button className={s.qtyBtn} onClick={() => updateQty(i, -1)}>−</button>
                    <span className={s.qtyVal}>{item.qty}</span>
                    <button className={s.qtyBtn} onClick={() => updateQty(i, +1)}>+</button>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 17, fontWeight: 500, color: "#1a1410", marginBottom: 8 }}>
                    ₹{(item.product.price * item.qty).toLocaleString("en-IN")}
                  </div>
                  <button className={s.removeBtn} onClick={() => updateQty(i, -item.qty)}>Remove</button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 28 }}>
              <Link href="/preview/aurum/shop" className={`${s.btn} ${s.btnOutline}`}>← Continue Shopping</Link>
            </div>
          </div>

          {/* Summary */}
          <div className={s.orderSummary}>
            <div className={s.orderSummaryTitle}>Order Summary</div>
            <div className={s.summaryRow}><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            <div className={s.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: shipping === 0 ? "#2d6a4f" : undefined }}>
                {shipping === 0 ? "Free" : `₹${shipping}`}
              </span>
            </div>
            {shipping > 0 && (
              <div style={{ background: "#f5ecd4", border: "1px solid #d4af6a", padding: "10px 14px", fontSize: 12, color: "#6b5f52", margin: "8px 0" }}>
                Add ₹{(10000 - subtotal).toLocaleString("en-IN")} more for free shipping
              </div>
            )}
            <div className={s.promoRow}>
              <input className={s.promoInput} placeholder="PROMO CODE" value={promo} onChange={e => setPromo(e.target.value)} />
              <button className={s.promoBtn}>Apply</button>
            </div>
            <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
            <Link href="/preview/aurum/checkout" className={`${s.btn} ${s.btnGold} ${s.btnFull} ${s.btnLg}`} style={{ marginTop: 20, display: "flex" }}>
              Proceed to Checkout
            </Link>
            <div className={s.secureNote}>
              🔒 Secure checkout · 256-bit SSL · Insured shipping
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <Reveal>
          <section className={s.section}>
            <div className={s.sectionHead}>
              <div>
                <span className={s.sectionLabel}>Complete Your Look</span>
                <h2 className={s.sectionTitle} style={{ fontSize: 32 }}>You Might Also Like</h2>
              </div>
            </div>
            <div className={s.productGrid4}>
              {PRODUCTS.slice(5, 9).map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 4) as 0|1|2|3} />)}
            </div>
          </section>
        </Reveal>
      </div>
    </PageShell>
  )
}
