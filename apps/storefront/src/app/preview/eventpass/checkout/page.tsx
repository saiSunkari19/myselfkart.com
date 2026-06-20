"use client"

import Link from "next/link"
import { useState } from "react"
import { NavBar, Footer, T } from "../_components"
import { EVENTS } from "../_data"

type Step = 1 | 2

export default function CheckoutPage() {
  const event = EVENTS[0]
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", gst: "" })
  const [showGst, setShowGst] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }))
  }

  const subtotal = 10997
  const serviceFee = 550
  const total = subtotal + serviceFee

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.name.trim())  e.name  = "Full name is required"
    if (!form.email.trim()) e.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email"
    if (!form.phone.trim()) e.phone = "Phone number is required"
    else if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid 10-digit number"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleContinue = () => {
    if (validate()) setStep(2)
  }

  const handlePay = () => {
    setSubmitting(true)
    setTimeout(() => {
      window.location.href = "/preview/eventpass/confirmation"
    }, 1200)
  }

  const STEPS = ["Contact Details", "Review & Pay", "Confirmation"]

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%", border: `1.5px solid ${hasError ? T.danger : T.border}`, borderRadius: 12,
    padding: "12px 16px", fontSize: 14, outline: "none",
    boxSizing: "border-box", color: T.text, fontFamily: "inherit",
  })

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .ep-checkout-grid { grid-template-columns: 1fr !important; }
          .ep-checkout-summary { position: static !important; }
        }
        @media (max-width: 480px) {
          .ep-checkout-wrap { padding: 32px 16px !important; }
          .ep-step-label { display: none; }
        }
      `}</style>
      <NavBar />
      <div style={{ paddingTop: 64 }}>
        <div className="ep-checkout-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 40px" }}>
          <div style={{ marginBottom: 32 }}>
            <Link href="/preview/eventpass/cart" style={{ color: T.accent, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              ← Back to cart
            </Link>
          </div>

          <h1 style={{ color: T.text, fontSize: "clamp(24px,5vw,32px)", fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
            Checkout
          </h1>
          <p style={{ color: T.textMuted, marginBottom: 40 }}>Just your contact details — no account needed.</p>

          {/* Steps indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 48 }}>
            {STEPS.map((label, i) => (
              <div key={label} style={{ display: "contents" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: i < step ? T.success : i === step - 1 ? T.accent : T.bgSubtle,
                    border: `2px solid ${i < step ? T.success : i === step - 1 ? T.accent : T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: i <= step - 1 ? "#fff" : T.textLight,
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {i < step - 1 ? "✓" : i + 1}
                  </div>
                  <span className="ep-step-label" style={{ color: i === step - 1 ? T.text : T.textLight, fontSize: 14, fontWeight: i === step - 1 ? 600 : 400 }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ height: 1, flex: 1, background: i < step - 1 ? T.success : T.border, transition: "background 0.3s" }} />
                )}
              </div>
            ))}
          </div>

          <div className="ep-checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
            {/* Left — step content */}
            <div>
              {/* Step 1: Contact Details */}
              {step === 1 && (
                <>
                  <div style={{
                    background: T.bgCard, border: `1px solid ${T.border}`,
                    borderRadius: T.radiusLg, padding: 32, boxShadow: T.shadow, marginBottom: 24,
                  }}>
                    <h2 style={{ color: T.text, fontWeight: 800, fontSize: 18, marginBottom: 24, marginTop: 0 }}>
                      Contact Details
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <div>
                        <label style={{ color: T.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Full Name *</label>
                        <input value={form.name} onChange={set("name")} placeholder="Ravi Kumar"
                          style={inputStyle(!!errors.name)}
                          onFocus={e => e.currentTarget.style.borderColor = T.accent}
                          onBlur={e => e.currentTarget.style.borderColor = errors.name ? T.danger : T.border}
                        />
                        {errors.name && <div style={{ color: T.danger, fontSize: 12, marginTop: 5 }}>{errors.name}</div>}
                      </div>

                      <div>
                        <label style={{ color: T.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Email Address *</label>
                        <input type="email" value={form.email} onChange={set("email")} placeholder="ravi@email.com"
                          style={inputStyle(!!errors.email)}
                          onFocus={e => e.currentTarget.style.borderColor = T.accent}
                          onBlur={e => e.currentTarget.style.borderColor = errors.email ? T.danger : T.border}
                        />
                        {errors.email
                          ? <div style={{ color: T.danger, fontSize: 12, marginTop: 5 }}>{errors.email}</div>
                          : <div style={{ color: T.textLight, fontSize: 12, marginTop: 6 }}>Your tickets will be sent to this email.</div>
                        }
                      </div>

                      <div>
                        <label style={{ color: T.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Phone Number *</label>
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={{
                            border: `1.5px solid ${T.border}`, borderRadius: 12,
                            padding: "12px 16px", fontSize: 14, color: T.textMuted, background: T.bgSubtle,
                            display: "flex", alignItems: "center", flexShrink: 0,
                          }}>🇮🇳 +91</div>
                          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="98765 43210"
                            style={{ ...inputStyle(!!errors.phone), flex: 1, width: "auto" }}
                            onFocus={e => e.currentTarget.style.borderColor = T.accent}
                            onBlur={e => e.currentTarget.style.borderColor = errors.phone ? T.danger : T.border}
                          />
                        </div>
                        {errors.phone && <div style={{ color: T.danger, fontSize: 12, marginTop: 5 }}>{errors.phone}</div>}
                      </div>

                      <div>
                        <label style={{ color: T.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                          Billing Address <span style={{ color: T.textLight, fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input value={form.address} onChange={set("address")} placeholder="123, MG Road, Mumbai"
                          style={inputStyle(false)}
                          onFocus={e => e.currentTarget.style.borderColor = T.accent}
                          onBlur={e => e.currentTarget.style.borderColor = T.border}
                        />
                      </div>

                      <div>
                        <button onClick={() => setShowGst(v => !v)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: T.accent, fontSize: 13, fontWeight: 600, padding: 0 }}
                        >
                          {showGst ? "▾" : "▸"} Add GST Information (for business use)
                        </button>
                        {showGst && (
                          <input value={form.gst} onChange={set("gst")} placeholder="GST Number (e.g. 22AAAAA0000A1Z5)"
                            style={{ ...inputStyle(false), marginTop: 12 }}
                            onFocus={e => e.currentTarget.style.borderColor = T.accent}
                            onBlur={e => e.currentTarget.style.borderColor = T.border}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: T.bgSubtle, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: "14px 20px", display: "flex", gap: 10, alignItems: "flex-start",
                    marginBottom: 24,
                  }}>
                    <span style={{ fontSize: 16 }}>🔒</span>
                    <p style={{ color: T.textMuted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                      Your information is safe with us. We don't store payment details and never share your data with third parties.
                    </p>
                  </div>

                  {/* Fix 6: Continue button */}
                  <button onClick={handleContinue} style={{
                    width: "100%", padding: "15px",
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "#fff", border: "none", borderRadius: 12,
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                  }}>
                    Continue to payment →
                  </button>
                </>
              )}

              {/* Step 2: Review & Pay */}
              {step === 2 && (
                <>
                  <div style={{
                    background: T.bgCard, border: `1px solid ${T.border}`,
                    borderRadius: T.radiusLg, padding: 32, boxShadow: T.shadow, marginBottom: 24,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                      <h2 style={{ color: T.text, fontWeight: 800, fontSize: 18, margin: 0 }}>Contact Details</h2>
                      <button onClick={() => setStep(1)} style={{
                        background: "none", border: `1px solid ${T.border}`,
                        borderRadius: 8, padding: "6px 14px", fontSize: 13,
                        color: T.accent, cursor: "pointer", fontWeight: 600,
                      }}>Edit</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[
                        { label: "Name", value: form.name },
                        { label: "Email", value: form.email },
                        { label: "Phone", value: `+91 ${form.phone}` },
                        ...(form.address ? [{ label: "Address", value: form.address }] : []),
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ color: T.textLight, fontSize: 11, fontWeight: 600, marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
                          <div style={{ color: T.text, fontSize: 14, fontWeight: 500 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    background: "#eef2ff", border: `1px solid #c7d2fe`,
                    borderRadius: 12, padding: "14px 20px", display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 16 }}>🎟️</span>
                    <p style={{ color: "#4338ca", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                      Your e-tickets will be sent to <strong>{form.email}</strong> instantly after payment.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Right — order summary */}
            <div className="ep-checkout-summary" style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: T.radiusLg, padding: 28, boxShadow: T.shadowMd, position: "sticky", top: 80,
            }}>
              <h3 style={{ color: T.text, fontWeight: 800, fontSize: 18, marginBottom: 20, marginTop: 0 }}>Order Summary</h3>

              <div style={{
                display: "flex", gap: 12, padding: "14px 0",
                borderBottom: `1px solid ${T.border}`, marginBottom: 16,
              }}>
                <img src={event.image} alt={event.title} style={{ width: 60, height: 50, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                <div>
                  <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{event.title}</div>
                  <div style={{ color: T.textMuted, fontSize: 12 }}>{event.date} · {event.city}</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "General Admission × 2", value: "₹4,998" },
                  { label: "VIP × 1", value: "₹5,999" },
                  { label: "Service fee", value: "₹550" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.textMuted, fontSize: 13 }}>{label}</span>
                    <span style={{ color: T.text, fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 24,
                display: "flex", justifyContent: "space-between",
              }}>
                <span style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ color: T.text, fontWeight: 900, fontSize: 22 }}>₹{total.toLocaleString()}</span>
              </div>

              {step === 1 ? (
                <button onClick={handleContinue} style={{
                  width: "100%", padding: "14px",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>
                  Continue →
                </button>
              ) : (
                <button onClick={handlePay} disabled={submitting} style={{
                  width: "100%", padding: "15px",
                  background: submitting ? T.bgSubtle : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: submitting ? T.textMuted : "#fff",
                  border: "none", borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: submitting ? "default" : "pointer",
                }}>
                  {submitting ? "Processing…" : `Pay ₹${total.toLocaleString()} →`}
                </button>
              )}

              <p style={{ color: T.textLight, fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
                Powered by Razorpay · 256-bit SSL
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
