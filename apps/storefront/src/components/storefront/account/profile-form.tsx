"use client"

import { logoutAction, updateProfileAction } from "../../../lib/customer/actions"
import type { CustomerView } from "../../../lib/views"
import { Field, cardStyle, ghostBtnStyle, inputStyle, primaryBtnStyle } from "./_ui"

/** Profile (name + phone) + sign-out. Email is read-only (it's the identity). */
export function ProfileForm({ customer, accent = "#111111" }: { customer: CustomerView; accent?: string }) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px", color: "#1c1917" }}>Profile</h2>
      <form action={updateProfileAction}>
        <Field label="Email">
          <input value={customer.email} readOnly style={{ ...inputStyle, background: "#f5f5f4", color: "#78716c" }} />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="First name">
              <input name="first_name" defaultValue={customer.first_name ?? ""} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Last name">
              <input name="last_name" defaultValue={customer.last_name ?? ""} style={inputStyle} />
            </Field>
          </div>
        </div>
        <Field label="Phone">
          <input name="phone" defaultValue={customer.phone ?? ""} style={inputStyle} />
        </Field>
        <button type="submit" style={primaryBtnStyle(accent)}>Save changes</button>
      </form>

      <hr style={{ border: "none", borderTop: "1px solid #e7e5e4", margin: "20px 0" }} />
      <form action={logoutAction}>
        <button type="submit" style={ghostBtnStyle}>Sign out</button>
      </form>
    </div>
  )
}
