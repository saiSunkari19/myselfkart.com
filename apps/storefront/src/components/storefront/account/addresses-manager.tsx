"use client"

import { useState } from "react"

import {
  addAddressAction,
  deleteAddressAction,
  updateAddressAction,
} from "../../../lib/customer/actions"
import type { CustomerAddressView } from "../../../lib/views"
import { Field, cardStyle, ghostBtnStyle, inputStyle, labelStyle, primaryBtnStyle } from "./_ui"

type Country = { iso_2: string; display_name?: string | null }

function AddressFields({
  address,
  countries,
}: {
  address?: CustomerAddressView
  countries: Country[]
}) {
  return (
    <>
      <Field label="Address label (e.g. Home, Work)">
        <input name="address_name" defaultValue={address?.address_name ?? ""} style={inputStyle} />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="First name">
            <input name="first_name" defaultValue={address?.first_name ?? ""} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Last name">
            <input name="last_name" defaultValue={address?.last_name ?? ""} style={inputStyle} />
          </Field>
        </div>
      </div>
      <Field label="Address line 1">
        <input name="address_1" required defaultValue={address?.address_1 ?? ""} placeholder="House / flat no., building, street" style={inputStyle} />
      </Field>
      <Field label="Address line 2 (optional)">
        <input name="address_2" defaultValue={address?.address_2 ?? ""} placeholder="Area, locality" style={inputStyle} />
      </Field>
      <Field label="Landmark (optional)">
        <input name="company" defaultValue={address?.company ?? ""} placeholder="e.g. near Laxma Reddy shop" style={inputStyle} />
      </Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="City">
            <input name="city" required defaultValue={address?.city ?? ""} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="State / Province">
            <input name="province" defaultValue={address?.province ?? ""} style={inputStyle} />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Postal code">
            <input name="postal_code" required defaultValue={address?.postal_code ?? ""} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Country">
            <select name="country_code" required defaultValue={address?.country_code ?? (countries[0]?.iso_2 ?? "")} style={inputStyle}>
              <option value="" disabled>Select country</option>
              {countries.map((c) => (
                <option key={c.iso_2} value={c.iso_2}>{c.display_name ?? c.iso_2.toUpperCase()}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <Field label="Phone (optional)">
        <input name="phone" defaultValue={address?.phone ?? ""} style={inputStyle} />
      </Field>
    </>
  )
}

function AddressCard({ address, countries, accent }: { address: CustomerAddressView; countries: Country[]; accent: string }) {
  const [editing, setEditing] = useState(false)
  const name = [address.first_name, address.last_name].filter(Boolean).join(" ")

  if (editing) {
    return (
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <form action={updateAddressAction} onSubmit={() => setEditing(false)}>
          <input type="hidden" name="address_id" value={address.id} />
          <AddressFields address={address} countries={countries} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={primaryBtnStyle(accent)}>Save changes</button>
            <button type="button" onClick={() => setEditing(false)} style={ghostBtnStyle}>Cancel</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div style={{ ...cardStyle, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          {address.address_name ? <div style={{ ...labelStyle, marginBottom: 4 }}>{address.address_name}</div> : null}
          <div style={{ fontSize: 14, color: "#1c1917", fontWeight: 600 }}>{name || "Address"}</div>
          <div style={{ fontSize: 13, color: "#57534e", marginTop: 4, lineHeight: 1.5 }}>
            {[address.address_1, address.address_2].filter(Boolean).join(", ")}
            <br />
            {address.company ? <>Landmark: {address.company}<br /></> : null}
            {[address.city, address.province, address.postal_code].filter(Boolean).join(", ")}
            <br />
            {address.country_code?.toUpperCase()}
            {address.phone ? ` · ${address.phone}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={() => setEditing(true)} style={ghostBtnStyle}>Edit</button>
          <form action={deleteAddressAction}>
            <input type="hidden" name="address_id" value={address.id} />
            <button type="submit" style={{ ...ghostBtnStyle, color: "#b91c1c" }}>Delete</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export function AddressesManager({
  addresses,
  countries,
  accent = "#111111",
}: {
  addresses: CustomerAddressView[]
  countries: Country[]
  accent?: string
}) {
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#1c1917" }}>Saved addresses</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} style={primaryBtnStyle(accent)} >
            + Add address
          </button>
        )}
      </div>

      {adding && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <form action={addAddressAction} onSubmit={() => setAdding(false)}>
            <AddressFields countries={countries} />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={primaryBtnStyle(accent)}>Save address</button>
              <button type="button" onClick={() => setAdding(false)} style={ghostBtnStyle}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !adding ? (
        <p style={{ color: "#78716c", fontSize: 14 }}>No saved addresses yet.</p>
      ) : (
        addresses.map((a) => <AddressCard key={a.id} address={a} countries={countries} accent={accent} />)
      )}
    </div>
  )
}
