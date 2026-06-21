"use client"

import React, { useState } from "react"
import Link from "next/link"
import { NavBar, Footer } from "../_components"
import { PRODUCTS } from "../_data"
import { useTemplateConfig } from "../../../../lib/template-config-context"
import s from "../_styles.module.css"
import c from "./_cart.module.css"

const INITIAL_ITEMS = [
  { product: PRODUCTS[0], qty: 1 },
  { product: PRODUCTS[1], qty: 2 },
  { product: PRODUCTS[2], qty: 1 },
]

const SHIPPING_THRESHOLD = 999
const SHIPPING_COST = 99

export function CartClient({ config }: { config?: import("../../../../lib/store-config").StoreConfig | null }) {
  const { basePath } = useTemplateConfig()
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [coupon, setCoupon] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState("")

  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.qty, 0)
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0
  const shipping = subtotal - discount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal - discount + shipping

  const setQty = (id: string, qty: number) => {
    if (qty < 1) return
    setItems(prev => prev.map(it => it.product.id === id ? { ...it, qty } : it))
  }
  const remove = (id: string) => setItems(prev => prev.filter(it => it.product.id !== id))

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "GLOW10") {
      setCouponApplied(true)
      setCouponError("")
    } else {
      setCouponError("Invalid coupon code.")
    }
  }

  const freeShippingLeft = SHIPPING_THRESHOLD - (subtotal - discount)

  const colorVars = {
    ...(config?.primary_color ? { "--charcoal": config.primary_color } : {}),
    ...(config?.accent_color  ? { "--gold":     config.accent_color  } : {}),
  } as React.CSSProperties

  return (
    <div className={s.page} style={colorVars}>
      <NavBar storeName={config?.store_name} logoUrl={config?.logo_url} announcementText={config?.announcement_enabled ? config?.announcement_text : null} />
      <div className={s.headerSpacer} />

      <div className={c.pageWrap}>
        <div className={s.container}>

          {/* Breadcrumb */}
          <div className={c.breadcrumb}>
            <Link href={basePath || "/"} className={c.breadcrumbLink}>Home</Link>
            <span>›</span>
            <Link href={`${basePath}/shop`} className={c.breadcrumbLink}>Shop</Link>
            <span>›</span>
            <span>Cart</span>
          </div>

          <h1 className={c.pageTitle}>Your Bag
            <span className={c.itemCount}>{items.reduce((n, it) => n + it.qty, 0)} items</span>
          </h1>

          {items.length === 0 ? (
            <div className={c.emptyState}>
              <div className={c.emptyIcon}>🛍</div>
              <div className={c.emptyTitle}>Your bag is empty</div>
              <p className={c.emptySub}>Discover clean, science-backed skincare made for your skin.</p>
              <Link href={`${basePath}/shop`} className={`${s.btn} ${s.btnDark}`}>Continue Shopping</Link>
            </div>
          ) : (
            <div className={c.layout}>

              {/* ── Cart Items ── */}
              <div className={c.itemsCol}>

                {/* Free shipping progress */}
                {freeShippingLeft > 0 ? (
                  <div className={c.shippingBanner}>
                    <span>
                      Add <strong>₹{freeShippingLeft.toLocaleString("en-IN")}</strong> more for <strong>free delivery</strong>
                    </span>
                    <div className={c.shippingBar}>
                      <div
                        className={c.shippingFill}
                        style={{ width: `${Math.min(100, ((subtotal - discount) / SHIPPING_THRESHOLD) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className={`${c.shippingBanner} ${c.shippingBannerGreen}`}>
                    🎉 You've unlocked <strong>free delivery!</strong>
                  </div>
                )}

                <div className={c.itemsList}>
                  {items.map(({ product: p, qty }) => (
                    <div key={p.id} className={c.cartItem}>
                      <img src={p.image} alt={p.name} className={c.itemImage} />
                      <div className={c.itemDetails}>
                        <div className={c.itemCategory}>{p.category}</div>
                        <div className={c.itemName}>{p.name}</div>
                        <div className={c.itemSub}>{p.subtitle}</div>
                        <div className={c.itemSize}>{p.size}</div>
                        <div className={c.itemBottom}>
                          <div className={c.qtyControl}>
                            <button className={c.qtyBtn} onClick={() => remove(p.id)} disabled={qty > 1} title="Remove">
                              {qty === 1 ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              ) : "−"}
                            </button>
                            <span className={c.qtyNum}>{qty}</span>
                            <button className={c.qtyBtn} onClick={() => setQty(p.id, qty + 1)}>+</button>
                          </div>
                          <div className={c.itemPrice}>
                            ₹{(p.price * qty).toLocaleString("en-IN")}
                            {qty > 1 && (
                              <span className={c.itemUnitPrice}>₹{p.price.toLocaleString("en-IN")} each</span>
                            )}
                          </div>
                          <button className={c.removeBtn} onClick={() => remove(p.id)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* You may also like */}
                <div className={c.upsell}>
                  <div className={c.upsellTitle}>Complete your routine</div>
                  <div className={c.upsellScroll}>
                    {PRODUCTS.filter(p => !items.find(it => it.product.id === p.id)).slice(0, 4).map(p => (
                      <div key={p.id} className={c.upsellCard}>
                        <img src={p.image} alt={p.name} className={c.upsellImg} />
                        <div className={c.upsellName}>{p.name}</div>
                        <div className={c.upsellPrice}>₹{p.price.toLocaleString("en-IN")}</div>
                        <button
                          className={c.upsellAdd}
                          onClick={() => setItems(prev => [...prev, { product: p, qty: 1 }])}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Order Summary ── */}
              <div className={c.summaryCol}>
                <div className={c.summaryCard}>
                  <div className={c.summaryTitle}>Order Summary</div>

                  <div className={c.summaryRow}>
                    <span>Subtotal ({items.reduce((n, it) => n + it.qty, 0)} items)</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {couponApplied && (
                    <div className={`${c.summaryRow} ${c.discountRow}`}>
                      <span>Discount (GLOW10)</span>
                      <span>−₹{discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className={c.summaryRow}>
                    <span>Shipping</span>
                    <span>{shipping === 0 ? <span className={c.freeTag}>FREE</span> : `₹${shipping}`}</span>
                  </div>

                  <div className={c.couponWrap}>
                    {couponApplied ? (
                      <div className={c.couponApplied}>
                        <span>✓ GLOW10 applied — 10% off</span>
                        <button onClick={() => { setCouponApplied(false); setCoupon("") }}>Remove</button>
                      </div>
                    ) : (
                      <>
                        <div className={c.couponRow}>
                          <input
                            className={c.couponInput}
                            placeholder="Coupon code (try GLOW10)"
                            value={coupon}
                            onChange={e => { setCoupon(e.target.value); setCouponError("") }}
                            onKeyDown={e => e.key === "Enter" && applyCoupon()}
                          />
                          <button className={c.couponBtn} onClick={applyCoupon}>Apply</button>
                        </div>
                        {couponError && <div className={c.couponError}>{couponError}</div>}
                      </>
                    )}
                  </div>

                  <div className={c.totalRow}>
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>

                  <Link href={`${basePath}/checkout`} className={c.checkoutBtn}>
                    Proceed to Checkout →
                  </Link>

                  <div className={c.trustRow}>
                    {["🔒 Secure checkout", "🚚 Free returns", "✓ 100-day guarantee"].map(t => (
                      <span key={t} className={c.trustNote}>{t}</span>
                    ))}
                  </div>

                  <div className={c.payIcons}>
                    {["VISA", "MC", "UPI", "GPay", "PayTM"].map(p => (
                      <span key={p} className={c.payIcon}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
