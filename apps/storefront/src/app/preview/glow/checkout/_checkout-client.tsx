"use client"

import React, { useState } from "react"
import Link from "next/link"
import { NavBar } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"
import c from "./_checkout.module.css"

const ORDER_ITEMS = [
  { product: PRODUCTS[0], qty: 1 },
  { product: PRODUCTS[1], qty: 2 },
  { product: PRODUCTS[2], qty: 1 },
]
const SUBTOTAL = ORDER_ITEMS.reduce((sum, it) => sum + it.product.price * it.qty, 0)
const SHIPPING = SUBTOTAL >= 999 ? 0 : 99
const TOTAL = SUBTOTAL + SHIPPING

const STEPS = ["Delivery", "Payment", "Review"]

type Step = 0 | 1 | 2

export function CheckoutClient({ config }: { config?: import("../../../../lib/store-config").StoreConfig | null }) {
  const [step, setStep] = useState<Step>(0)
  const [placed, setPlaced] = useState(false)

  // Form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", pincode: "",
    payMethod: "upi",
    upiId: "", cardNum: "", cardName: "", cardExp: "", cardCvv: "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const colorVars = {
    ...(config?.primary_color ? { "--charcoal": config.primary_color } : {}),
    ...(config?.accent_color  ? { "--gold":     config.accent_color  } : {}),
  } as React.CSSProperties

  if (placed) return <OrderSuccess />

  return (
    <div className={s.page} style={colorVars}>
      <NavBar storeName={config?.store_name} logoUrl={config?.logo_url} announcementText={config?.announcement_enabled ? config?.announcement_text : null} />
      <div className={s.headerSpacer} />

      <div className={c.pageWrap}>
        <div className={c.inner}>

          {/* Left column */}
          <div className={c.formCol}>

            {/* Logo + breadcrumb */}
            <Link href="/preview/glow" className={c.logoLink}>glow.</Link>

            {/* Step tabs */}
            <div className={c.stepBar}>
              {STEPS.map((label, i) => (
                <div key={label} className={c.stepItem}>
                  <div className={`${c.stepCircle} ${i < step ? c.stepDone : i === step ? c.stepActive : ""}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`${c.stepLabel} ${i === step ? c.stepLabelActive : ""}`}>{label}</span>
                  {i < STEPS.length - 1 && <div className={`${c.stepLine} ${i < step ? c.stepLineDone : ""}`} />}
                </div>
              ))}
            </div>

            {/* ── Step 0: Delivery ── */}
            {step === 0 && (
              <div className={c.section}>
                <div className={c.sectionTitle}>Delivery Information</div>

                <div className={c.row2}>
                  <Field label="First Name" value={form.firstName} onChange={v => set("firstName", v)} placeholder="Priya" />
                  <Field label="Last Name" value={form.lastName} onChange={v => set("lastName", v)} placeholder="Mehta" />
                </div>
                <Field label="Email Address" type="email" value={form.email} onChange={v => set("email", v)} placeholder="priya@example.com" />
                <Field label="Phone Number" type="tel" value={form.phone} onChange={v => set("phone", v)} placeholder="+91 98765 43210" />
                <Field label="Street Address" value={form.address} onChange={v => set("address", v)} placeholder="Flat 4B, Sunshine Apartments, MG Road" />
                <div className={c.row3}>
                  <Field label="City" value={form.city} onChange={v => set("city", v)} placeholder="Mumbai" />
                  <Field label="State" value={form.state} onChange={v => set("state", v)} placeholder="Maharashtra" />
                  <Field label="Pincode" value={form.pincode} onChange={v => set("pincode", v)} placeholder="400001" />
                </div>

                <div className={c.deliveryOptions}>
                  <div className={c.sectionTitle} style={{ marginBottom: 12 }}>Delivery Method</div>
                  {[
                    { id: "standard", label: "Standard Delivery", sub: "4–6 business days", price: SHIPPING === 0 ? "FREE" : "₹99" },
                    { id: "express", label: "Express Delivery", sub: "1–2 business days", price: "₹149" },
                  ].map(opt => (
                    <label key={opt.id} className={c.radioCard}>
                      <input type="radio" name="delivery" defaultChecked={opt.id === "standard"} />
                      <div className={c.radioCardInner}>
                        <div>
                          <div className={c.radioCardLabel}>{opt.label}</div>
                          <div className={c.radioCardSub}>{opt.sub}</div>
                        </div>
                        <div className={`${c.radioCardPrice} ${opt.price === "FREE" ? c.freeTag : ""}`}>{opt.price}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <button className={c.nextBtn} onClick={() => setStep(1)}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* ── Step 1: Payment ── */}
            {step === 1 && (
              <div className={c.section}>
                <div className={c.sectionTitle}>Payment Method</div>

                <div className={c.payMethods}>
                  {[
                    { id: "upi", label: "UPI", icon: "◎" },
                    { id: "card", label: "Credit / Debit Card", icon: "▭" },
                    { id: "cod", label: "Cash on Delivery", icon: "💵" },
                    { id: "netbanking", label: "Net Banking", icon: "🏦" },
                  ].map(m => (
                    <label key={m.id} className={`${c.payMethod} ${form.payMethod === m.id ? c.payMethodActive : ""}`}>
                      <input
                        type="radio"
                        name="pay"
                        value={m.id}
                        checked={form.payMethod === m.id}
                        onChange={() => set("payMethod", m.id)}
                        className={c.radioHidden}
                      />
                      <span className={c.payMethodIcon}>{m.icon}</span>
                      <span className={c.payMethodLabel}>{m.label}</span>
                    </label>
                  ))}
                </div>

                {form.payMethod === "upi" && (
                  <div className={c.payFields}>
                    <Field label="UPI ID" value={form.upiId} onChange={v => set("upiId", v)} placeholder="yourname@upi" />
                    <p className={c.payNote}>You'll receive a payment request on your UPI app.</p>
                  </div>
                )}

                {form.payMethod === "card" && (
                  <div className={c.payFields}>
                    <Field label="Card Number" value={form.cardNum} onChange={v => set("cardNum", v)} placeholder="1234 5678 9012 3456" />
                    <Field label="Name on Card" value={form.cardName} onChange={v => set("cardName", v)} placeholder="Priya Mehta" />
                    <div className={c.row2}>
                      <Field label="Expiry (MM/YY)" value={form.cardExp} onChange={v => set("cardExp", v)} placeholder="08/27" />
                      <Field label="CVV" value={form.cardCvv} onChange={v => set("cardCvv", v)} placeholder="•••" />
                    </div>
                  </div>
                )}

                {form.payMethod === "cod" && (
                  <div className={c.payNote} style={{ marginTop: 16 }}>
                    Pay ₹{TOTAL.toLocaleString("en-IN")} in cash when your order arrives. A small COD fee of ₹30 may apply.
                  </div>
                )}

                {form.payMethod === "netbanking" && (
                  <div className={c.payFields}>
                    <div className={c.bankGrid}>
                      {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Other"].map(bank => (
                        <button key={bank} className={c.bankBtn}>{bank}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={c.navBtns}>
                  <button className={c.backBtn} onClick={() => setStep(0)}>← Back</button>
                  <button className={c.nextBtn} onClick={() => setStep(2)}>Review Order →</button>
                </div>
              </div>
            )}

            {/* ── Step 2: Review ── */}
            {step === 2 && (
              <div className={c.section}>
                <div className={c.sectionTitle}>Review Your Order</div>

                <div className={c.reviewBlock}>
                  <div className={c.reviewBlockTitle}>
                    Delivery Address
                    <button className={c.editBtn} onClick={() => setStep(0)}>Edit</button>
                  </div>
                  <div className={c.reviewText}>
                    {form.firstName || "Priya"} {form.lastName || "Mehta"}<br />
                    {form.address || "Flat 4B, Sunshine Apartments, MG Road"}<br />
                    {form.city || "Mumbai"}, {form.state || "Maharashtra"} — {form.pincode || "400001"}<br />
                    {form.phone || "+91 98765 43210"} · {form.email || "priya@example.com"}
                  </div>
                </div>

                <div className={c.reviewBlock}>
                  <div className={c.reviewBlockTitle}>
                    Payment
                    <button className={c.editBtn} onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <div className={c.reviewText}>
                    {form.payMethod === "upi" && `UPI — ${form.upiId || "yourname@upi"}`}
                    {form.payMethod === "card" && `Card ending in ${form.cardNum ? form.cardNum.slice(-4) : "3456"}`}
                    {form.payMethod === "cod" && "Cash on Delivery"}
                    {form.payMethod === "netbanking" && "Net Banking"}
                  </div>
                </div>

                <div className={c.reviewBlock}>
                  <div className={c.reviewBlockTitle}>Items</div>
                  {ORDER_ITEMS.map(({ product: p, qty }) => (
                    <div key={p.id} className={c.reviewItem}>
                      <img src={p.image} alt={p.name} className={c.reviewImg} />
                      <div className={c.reviewItemName}>{p.name} <span className={c.reviewItemQty}>× {qty}</span></div>
                      <div className={c.reviewItemPrice}>₹{(p.price * qty).toLocaleString("en-IN")}</div>
                    </div>
                  ))}
                </div>

                <div className={c.navBtns}>
                  <button className={c.backBtn} onClick={() => setStep(1)}>← Back</button>
                  <button className={c.placeBtn} onClick={() => setPlaced(true)}>
                    Place Order · ₹{TOTAL.toLocaleString("en-IN")}
                  </button>
                </div>

                <p className={c.termsNote}>
                  By placing your order you agree to Glow's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </p>
              </div>
            )}

          </div>

          {/* ── Right: Order summary ── */}
          <aside className={c.summaryCol}>
            <div className={c.summaryCard}>
              <div className={c.summaryTitle}>Your Order</div>
              {ORDER_ITEMS.map(({ product: p, qty }) => (
                <div key={p.id} className={c.summaryItem}>
                  <div className={c.summaryImgWrap}>
                    <img src={p.image} alt={p.name} className={c.summaryImg} />
                    <span className={c.summaryBadge}>{qty}</span>
                  </div>
                  <div className={c.summaryItemName}>{p.name}</div>
                  <div className={c.summaryItemPrice}>₹{(p.price * qty).toLocaleString("en-IN")}</div>
                </div>
              ))}
              <div className={c.summaryDivider} />
              <div className={c.summaryRow}><span>Subtotal</span><span>₹{SUBTOTAL.toLocaleString("en-IN")}</span></div>
              <div className={c.summaryRow}>
                <span>Shipping</span>
                <span>{SHIPPING === 0 ? <span className={c.freeTag}>FREE</span> : `₹${SHIPPING}`}</span>
              </div>
              <div className={c.summaryDivider} />
              <div className={c.summaryTotal}><span>Total</span><span>₹{TOTAL.toLocaleString("en-IN")}</span></div>
              <div className={c.summaryNote}>Inclusive of all taxes</div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}

/* ── Field component ── */
function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string
}) {
  return (
    <div className={c.field}>
      <label className={c.fieldLabel}>{label}</label>
      <input
        className={c.fieldInput}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

/* ── Order success screen ── */
function OrderSuccess() {
  return (
    <div className={c.successPage}>
      <div className={c.successCard}>
        <div className={c.successIcon}>✓</div>
        <h1 className={c.successTitle}>Order Placed!</h1>
        <p className={c.successSub}>
          Thank you for your order. You'll receive a confirmation email shortly.
          Your skin ritual is on its way. 🌿
        </p>
        <div className={c.successOrderId}>Order #GW-{Math.floor(100000 + Math.random() * 900000)}</div>
        <div className={c.successItems}>
          {ORDER_ITEMS.map(({ product: p, qty }) => (
            <div key={p.id} className={c.successItem}>
              <img src={p.image} alt={p.name} className={c.successItemImg} />
              <div>
                <div className={c.successItemName}>{p.name}</div>
                <div className={c.successItemMeta}>Qty: {qty} · ₹{(p.price * qty).toLocaleString("en-IN")}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={c.successTimeline}>
          {[
            { label: "Order Confirmed", done: true },
            { label: "Packed & Dispatched", done: false },
            { label: "Out for Delivery", done: false },
            { label: "Delivered", done: false },
          ].map((st, i) => (
            <div key={st.label} className={c.successStep}>
              <div className={`${c.successStepDot} ${st.done ? c.successStepDone : ""}`}>{st.done ? "✓" : i + 1}</div>
              <span className={c.successStepLabel}>{st.label}</span>
            </div>
          ))}
        </div>
        <div className={c.successBtns}>
          <Link href="/preview/glow/shop" className={c.successShopBtn}>Continue Shopping</Link>
          <Link href="/preview/glow" className={c.successHomeBtn}>Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
