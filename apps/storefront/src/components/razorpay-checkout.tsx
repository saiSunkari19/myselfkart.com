"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import {
  completeRazorpayOrderAction,
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

/** Loads the Razorpay checkout script once and resolves when it's ready. */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false)
      return
    }
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`
    )
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
}: {
  storeName: string
  email: string | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pay = useCallback(async () => {
    setBusy(true)
    setError(null)

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
      theme: { color: "#111111" },
      handler: async () => {
        // The backend re-checks Razorpay before creating the order, so we don't
        // trust this callback for authorization — we just trigger completion.
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
  }, [router, storeName, email])

  return (
    <div className="razorpay-checkout">
      {error ? <p className="state error">{error}</p> : null}
      <button type="button" onClick={pay} disabled={busy}>
        {busy ? "Processing…" : "Pay with Razorpay"}
      </button>
    </div>
  )
}
