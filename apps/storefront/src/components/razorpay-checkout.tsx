"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import {
  completeRazorpayOrderAction,
  getPaymentSetupAction,
  startRazorpayCheckoutAction,
} from "../lib/cart/actions"

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js"

type RazorpayOptions = {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpayHandlerResponse) => void
  modal?: { ondismiss?: () => void }
}

type RazorpayHandlerResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayInstance = { open: () => void }

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(false); return }
    if (window.Razorpay) { resolve(true); return }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve(true))
      existing.addEventListener("error", () => resolve(false))
      return
    }
    const script = document.createElement("script")
    script.src = RAZORPAY_SCRIPT_SRC
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function RazorpayCheckout({
  storeName,
  email,
  accentColor,
}: {
  storeName: string
  email: string | null
  accentColor?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pay = useCallback(async () => {
    setBusy(true)
    setError(null)

    // Check if this store has Razorpay configured before doing anything else
    const paymentSetup = await getPaymentSetupAction()
    if (!paymentSetup.razorpay) {
      setError("Payment setup not done for this store. Please contact the seller to complete Razorpay configuration.")
      setBusy(false)
      return
    }

    const scriptReady = await loadRazorpayScript()
    if (!scriptReady || !window.Razorpay) {
      setError("Could not load Razorpay. Check your connection and retry.")
      setBusy(false)
      return
    }

    const started = await startRazorpayCheckoutAction()
    if (!started.ok) {
      setError(started.error)
      setBusy(false)
      return
    }

    const { session } = started
    const rzp = new window.Razorpay({
      key: session.key_id,
      order_id: session.order_id,
      amount: session.amount,
      currency: session.currency,
      name: storeName,
      description: "Order payment",
      prefill: email ? { email } : undefined,
      theme: { color: accentColor ?? "#111111" },
      handler: async () => {
        const completed = await completeRazorpayOrderAction()
        if (completed.ok) {
          router.push(`/order/${completed.orderId}`)
        } else {
          setError(completed.error)
          setBusy(false)
        }
      },
      modal: {
        ondismiss: () => {
          setError("Payment was cancelled.")
          setBusy(false)
        },
      },
    })
    rzp.open()
  }, [router, storeName, email, accentColor])

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 24px",
    background: accentColor ?? "#111111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
    marginTop: 8,
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {error ? (
        <div style={{
          padding: "12px 16px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 8,
          fontSize: 13,
          color: "#dc2626",
          lineHeight: 1.5,
        }}>
          {error}
        </div>
      ) : null}
      <button type="button" onClick={pay} disabled={busy} style={btnStyle}>
        {busy ? "Processing…" : "Pay with Razorpay"}
      </button>
      <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
        🔒 Secured by Razorpay · 256-bit SSL
      </div>
    </div>
  )
}
