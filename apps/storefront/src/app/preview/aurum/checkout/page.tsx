"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageShell } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const CART = [
  { product: PRODUCTS[1], size: "8", qty: 1 },
  { product: PRODUCTS[3], size: "", qty: 1 },
]
const subtotal = CART.reduce((s, i) => s + i.product.price, 0)
const shipping = 0
const total = subtotal + shipping

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState<"info" | "payment">("info")
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", pincode: "",
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === "info") setStep("payment")
    else router.push("/preview/aurum/confirmation")
  }

  return (
    <PageShell>
      <div className={s.container}>
        <div style={{ padding: "40px 0 0" }}>
          <Link href="/preview/aurum/cart" style={{ fontSize: 12, color: "#a09080", letterSpacing: 0.5, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to Bag
          </Link>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "24px 0 40px" }}>
          {["Your Details", "Payment"].map((label, i) => {
            const isActive = (i === 0 && step === "info") || (i === 1 && step === "payment")
            const isDone = i === 0 && step === "payment"
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, border: `1.5px solid ${isDone ? "#b8962e" : isActive ? "#1a1410" : "#e8e0d4"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600,
                  background: isDone ? "#fdf9f4" : isActive ? "#1a1410" : "#fff",
                  color: isDone ? "#b8962e" : isActive ? "#fff" : "#a09080",
                }}>
                  {isDone ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: isActive ? "#1a1410" : "#a09080", fontWeight: isActive ? 700 : 400 }}>
                  {label}
                </span>
                {i < 1 && <span style={{ color: "#e8e0d4", margin: "0 8px", fontSize: 16 }}>→</span>}
              </div>
            )
          })}
        </div>

        <div className={s.checkoutLayout}>
          <form onSubmit={submit} className={s.checkoutForm}>

            {step === "info" && (
              <div className={s.formBlock}>
                <div className={s.formBlockTitle}>Contact & Shipping Information</div>
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
                    <label className={s.formLabel}>Email Address</label>
                    <input className={s.formInput} type="email" value={form.email} onChange={set("email")} required placeholder="you@email.com" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Mobile Number</label>
                    <input className={s.formInput} type="tel" value={form.phone} onChange={set("phone")} required placeholder="+91 98000 00000" />
                  </div>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}>
                    <label className={s.formLabel}>Shipping Address</label>
                    <input className={s.formInput} value={form.address} onChange={set("address")} required placeholder="Flat, Building, Street" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>City</label>
                    <input className={s.formInput} value={form.city} onChange={set("city")} required placeholder="Mumbai" />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>State</label>
                    <select className={s.formSelect} value={form.state} onChange={set("state")} required>
                      <option value="">Select State</option>
                      {["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Rajasthan", "West Bengal"].map(st => (
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
              <div className={s.formBlock}>
                <div className={s.formBlockTitle}>Payment Method</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 28 }}>
                  {[{ icon: "💳", label: "Card" }, { icon: "📱", label: "UPI" }, { icon: "🏦", label: "Net Banking" }, { icon: "📄", label: "EMI" }].map((m, i) => (
                    <div key={m.label} style={{
                      border: `1.5px solid ${i === 0 ? "#b8962e" : "#e8e0d4"}`,
                      padding: "14px", textAlign: "center", cursor: "pointer",
                      background: i === 0 ? "#fdf9f4" : "#fff",
                    }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#6b5f52" }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className={s.formGrid}>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}>
                    <label className={s.formLabel}>Card Number</label>
                    <input className={s.formInput} placeholder="1234 5678 9012 3456" maxLength={19} />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Expiry Date</label>
                    <input className={s.formInput} placeholder="MM / YY" maxLength={7} />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>CVV</label>
                    <input className={s.formInput} placeholder="•••" maxLength={4} type="password" />
                  </div>
                  <div className={`${s.formGroup} ${s.formGroupFull}`}>
                    <label className={s.formLabel}>Name on Card</label>
                    <input className={s.formInput} placeholder="Priya Sharma" />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className={`${s.btn} ${s.btnGold} ${s.btnFull} ${s.btnLg}`}>
              {step === "info" ? "Continue to Payment →" : `Confirm & Pay ₹${total.toLocaleString("en-IN")}`}
            </button>

            <div style={{ fontSize: 11, color: "#a09080", textAlign: "center", letterSpacing: 0.5 }}>
              🔒 256-bit SSL encryption · All payments secured by Razorpay
            </div>
          </form>

          {/* Order summary */}
          <div className={s.orderSummary} style={{ top: 130 }}>
            <div className={s.orderSummaryTitle}>Your Order</div>
            {CART.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                <div style={{ width: 64, aspectRatio: "3/4", overflow: "hidden", background: "#fdf9f4", flexShrink: 0 }}>
                  <img src={item.product.image} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1410", marginBottom: 2 }}>{item.product.name}</div>
                  <div style={{ fontSize: 11, color: "#a09080", marginBottom: 2 }}>{item.product.metal}</div>
                  {item.size && <div style={{ fontSize: 11, color: "#a09080" }}>Size: {item.size}</div>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1410", flexShrink: 0 }}>
                  ₹{item.product.price.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
            <hr style={{ border: "none", borderTop: "1px solid #e8e0d4", margin: "16px 0" }} />
            <div className={s.summaryRow}><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            <div className={s.summaryRow}><span>Insured Shipping</span><span style={{ color: "#2d6a4f" }}>Free</span></div>
            <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
