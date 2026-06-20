"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageShell } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"

const CART = [
  { product: PRODUCTS[0], qty: 1, storage: "256GB" },
  { product: PRODUCTS[3], qty: 1 },
]
const subtotal = CART.reduce((s, i) => s + i.product.price, 0)
const total = subtotal

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  const [payMethod, setPayMethod] = useState(0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 1) setStep(step + 1)
    else router.push("/preview/volt/confirmation")
  }

  const steps = ["Shipping Info", "Payment"]

  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/preview/volt/cart" style={{ fontSize: 13, color: "var(--accent)" }}>← Back to Cart</Link>
          </div>
          <div className={s.pageHeaderTitle} style={{ marginTop: 8 }}>Checkout</div>
        </div>
      </div>

      <div className={s.container}>
        {/* Steps indicator */}
        <div style={{ display: "flex", gap: 0, padding: "20px 0 24px", borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
          {steps.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i <= step ? "var(--accent)" : "var(--bg3)",
                color: i <= step ? "#fff" : "var(--text3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
              }}>{i < step ? "✓" : i + 1}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: i <= step ? "var(--text)" : "var(--text3)" }}>{label}</span>
              {i < steps.length - 1 && <div style={{ width: 48, height: 1, background: i < step ? "var(--accent)" : "var(--border)", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        <div className={s.checkoutLayout}>
          <form onSubmit={submit} className={s.checkoutForm}>
            {step === 0 && (
              <div className={s.formCard}>
                <div className={s.formCardHead}>
                  <div className={s.formCardHeadNum}>1</div>
                  <div className={s.formCardHeadTitle}>Shipping Information</div>
                </div>
                <div className={s.formCardBody}>
                  <div className={s.formGrid}>
                    <div className={s.formGroup}><label className={s.formLabel}>First Name</label><input className={s.formInput} value={form.firstName} onChange={set("firstName")} required placeholder="Rahul" /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>Last Name</label><input className={s.formInput} value={form.lastName} onChange={set("lastName")} required placeholder="Sharma" /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>Email Address</label><input className={s.formInput} type="email" value={form.email} onChange={set("email")} required placeholder="you@email.com" /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>Mobile Number</label><input className={s.formInput} type="tel" value={form.phone} onChange={set("phone")} required placeholder="+91 98000 00000" /></div>
                    <div className={`${s.formGroup} ${s.formGroupFull}`}><label className={s.formLabel}>Street Address</label><input className={s.formInput} value={form.address} onChange={set("address")} required placeholder="Flat no., Building, Street" /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>City</label><input className={s.formInput} value={form.city} onChange={set("city")} required placeholder="Mumbai" /></div>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>State</label>
                      <select className={s.formSelect} value={form.state} onChange={set("state")} required>
                        <option value="">Select state</option>
                        {["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Rajasthan", "West Bengal"].map(st => <option key={st}>{st}</option>)}
                      </select>
                    </div>
                    <div className={s.formGroup}><label className={s.formLabel}>PIN Code</label><input className={s.formInput} value={form.pincode} onChange={set("pincode")} required placeholder="400001" maxLength={6} /></div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className={s.formCard}>
                <div className={s.formCardHead}>
                  <div className={s.formCardHeadNum}>2</div>
                  <div className={s.formCardHeadTitle}>Payment Method</div>
                </div>
                <div className={s.formCardBody}>
                  <div className={s.paymentMethods}>
                    {[{ icon: "💳", label: "Card" }, { icon: "📱", label: "UPI" }, { icon: "🏦", label: "Net Banking" }, { icon: "📄", label: "EMI" }].map((m, i) => (
                      <div key={m.label} className={`${s.paymentMethod} ${i === payMethod ? s.paymentMethodActive : ""}`} onClick={() => setPayMethod(i)}>
                        <div className={s.paymentMethodIcon}>{m.icon}</div>
                        <div className={s.paymentMethodLabel}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className={s.formGrid} style={{ marginTop: 20 }}>
                    <div className={`${s.formGroup} ${s.formGroupFull}`}><label className={s.formLabel}>Card Number</label><input className={s.formInput} placeholder="1234 5678 9012 3456" maxLength={19} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>Expiry</label><input className={s.formInput} placeholder="MM / YY" maxLength={7} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>CVV</label><input className={s.formInput} type="password" placeholder="•••" maxLength={4} /></div>
                    <div className={`${s.formGroup} ${s.formGroupFull}`}><label className={s.formLabel}>Name on Card</label><input className={s.formInput} placeholder="Rahul Sharma" /></div>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull} ${s.btnLg}`}>
              {step === 0 ? "Continue to Payment →" : `Pay ₹${total.toLocaleString("en-IN")}`}
            </button>
            <div className={s.secureNote}>🔒 256-bit SSL encryption · Secured by Razorpay</div>
          </form>

          {/* Summary */}
          <div className={s.orderSummary}>
            <div className={s.orderSummaryTitle}>Order Summary</div>
            {CART.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "var(--bg2)", flexShrink: 0 }}>
                  <img src={item.product.image} alt={item.product.name} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{item.product.name}</div>
                  {"storage" in item && <div style={{ fontSize: 11.5, color: "var(--text3)" }}>{(item as any).storage}</div>}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>₹{item.product.price.toLocaleString("en-IN")}</div>
              </div>
            ))}
            <hr className={s.divider} />
            <div className={s.summaryRow}><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            <div className={s.summaryRow}><span>Shipping</span><span style={{ color: "var(--success)" }}>Free</span></div>
            <div className={`${s.summaryRow} ${s.summaryRowTotal}`}><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
