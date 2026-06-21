"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageShell } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"
import { RazorpayCheckout } from "../../../../components/razorpay-checkout"
import { useTemplateConfig } from "../../../../lib/template-config-context"

const CART_ITEMS = [
  { product: PRODUCTS[0], size: "M", qty: 1 },
  { product: PRODUCTS[6], size: "M/L", qty: 1 },
]

const subtotal = CART_ITEMS.reduce((sum, i) => sum + i.product.price * i.qty, 0)
const shipping = subtotal >= 2999 ? 0 : 199
const total = subtotal + shipping

export default function CheckoutPage() {
  const router = useRouter()
  const { config } = useTemplateConfig()
  const [step, setStep] = useState<"shipping" | "payment">("shipping")
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", pincode: "",
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === "shipping") setStep("payment")
    else router.push("/preview/thread/confirmation")
  }

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.pageTitle}>
          <Link href="/preview/thread/cart" style={{ fontSize: 13, color: "#a09890", textDecoration: "none", display: "block", marginBottom: 8 }}>
            ← Back to Bag
          </Link>
          <h1 className={s.pageTitleText}>Checkout</h1>
        </div>

        <div className={s.checkoutLayout}>
          <form className={s.checkoutForm} onSubmit={handleContinue}>
            {/* Step indicator */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              {["Shipping", "Payment"].map((stepLabel, i) => {
                const isActive = (i === 0 && step === "shipping") || (i === 1 && step === "payment")
                const isDone = i === 0 && step === "payment"
                return (
                  <div key={stepLabel} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isDone ? "#22c55e" : isActive ? "#1a1a1a" : "#e8e4df",
                      color: isDone || isActive ? "#fff" : "#a09890",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "#1a1a1a" : "#a09890" }}>
                      {stepLabel}
                    </span>
                    {i < 1 && <span style={{ color: "#e8e4df", margin: "0 4px" }}>→</span>}
                  </div>
                )
              })}
            </div>

            {step === "shipping" && (
              <div className={s.formSection}>
                <div className={s.formSectionTitle}>Shipping Information</div>
                <div className={s.formGrid}>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>First Name</label>
                    <input className={s.formInput} value={form.firstName} onChange={set("firstName")} required placeholder="Priya" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Last Name</label>
                    <input className={s.formInput} value={form.lastName} onChange={set("lastName")} required placeholder="Sharma" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Email</label>
                    <input className={s.formInput} type="email" value={form.email} onChange={set("email")} required placeholder="you@email.com" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Phone</label>
                    <input className={s.formInput} type="tel" value={form.phone} onChange={set("phone")} required placeholder="+91 98000 00000" />
                  </div>
                  <div className={`${s.formGroup} ${s.fullWidth}`}>
                    <label className={s.formLabel}>Address</label>
                    <input className={s.formInput} value={form.address} onChange={set("address")} required placeholder="Flat / Building / Street" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>City</label>
                    <input className={s.formInput} value={form.city} onChange={set("city")} required placeholder="Mumbai" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>State</label>
                    <select className={s.formSelect} value={form.state} onChange={set("state")} required>
                      <option value="">Select state</option>
                      {["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan", "West Bengal", "Telangana"].map(st => (
                        <option key={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>PIN Code</label>
                    <input className={s.formInput} value={form.pincode} onChange={set("pincode")} required placeholder="400001" maxLength={6} />
                  </div>
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className={s.formSection}>
                <div className={s.formSectionTitle}>Payment</div>
                <RazorpayCheckout
                  storeName={config?.store_name ?? "THREAD"}
                  accentColor={config?.accent_color ?? undefined}
                  email={form.email || null}
                />
              </div>
            )}

            {step === "shipping" && (
              <button type="submit" className={`${s.btn} ${s.btnFull}`}>
                Continue to Payment →
              </button>
            )}
          </form>

          {/* Order Summary */}
          <div className={s.orderSummary} style={{ position: "sticky", top: 100 }}>
            <div className={s.orderSummaryTitle}>Your Order</div>
            {CART_ITEMS.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "center" }}>
                <div style={{ width: 56, aspectRatio: "3/4", borderRadius: 8, overflow: "hidden", background: "#f0ebe2", flexShrink: 0 }}>
                  <img src={item.product.image} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.product.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#a09890" }}>Size: {item.size} · Qty: {item.qty}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", flexShrink: 0 }}>
                  ₹{(item.product.price * item.qty).toLocaleString()}
                </div>
              </div>
            ))}
            <hr style={{ border: "none", borderTop: "1px solid #e8e4df", margin: "16px 0" }} />
            <div className={s.summaryRow}><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className={s.summaryRow}><span>Shipping</span><span style={{ color: shipping === 0 ? "#22c55e" : undefined }}>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
            <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>₹{total.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
