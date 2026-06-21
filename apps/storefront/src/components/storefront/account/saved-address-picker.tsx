"use client"

import { useState } from "react"

import { setAddressAction } from "../../../lib/cart/actions"
import type { CustomerAddressView } from "../../../lib/views"
import { primaryBtnStyle } from "./_ui"

/**
 * Checkout helper: pick a saved address to populate the cart's shipping address
 * (posts the existing setAddressAction). Rendered above each theme's manual
 * address form; selecting "enter a new address" just falls through to that form.
 */
export function SavedAddressPicker({
  addresses,
  email,
  accent = "#111111",
}: {
  addresses: CustomerAddressView[]
  email: string
  accent?: string
}) {
  const [selected, setSelected] = useState(addresses[0]?.id ?? "")
  if (addresses.length === 0) return null
  const addr = addresses.find((a) => a.id === selected)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#1c1917" }}>
        Use a saved address
      </div>
      <form action={setAddressAction}>
        {addresses.map((a) => {
          const name = [a.first_name, a.last_name].filter(Boolean).join(" ")
          const line = [a.address_1, a.city, a.postal_code].filter(Boolean).join(", ")
          return (
            <label
              key={a.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "10px 12px",
                border: `1px solid ${selected === a.id ? accent : "#e7e5e4"}`,
                borderRadius: 10,
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="_pick"
                checked={selected === a.id}
                onChange={() => setSelected(a.id)}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, color: "#1c1917" }}>
                <strong>{a.address_name || name || "Address"}</strong>
                <br />
                <span style={{ color: "#57534e" }}>{line}</span>
              </span>
            </label>
          )
        })}

        {/* Hidden fields carry the selected address into setAddressAction. */}
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="first_name" value={addr?.first_name ?? ""} />
        <input type="hidden" name="last_name" value={addr?.last_name ?? ""} />
        <input type="hidden" name="address_1" value={addr?.address_1 ?? ""} />
        <input type="hidden" name="city" value={addr?.city ?? ""} />
        <input type="hidden" name="province" value={addr?.province ?? ""} />
        <input type="hidden" name="postal_code" value={addr?.postal_code ?? ""} />
        <input type="hidden" name="country_code" value={addr?.country_code ?? ""} />
        <input type="hidden" name="phone" value={addr?.phone ?? ""} />

        <button type="submit" style={primaryBtnStyle(accent)}>Deliver to this address</button>
      </form>

      <div style={{ textAlign: "center", color: "#a8a29e", fontSize: 12.5, margin: "14px 0 4px" }}>
        — or enter a new address below —
      </div>
    </div>
  )
}
