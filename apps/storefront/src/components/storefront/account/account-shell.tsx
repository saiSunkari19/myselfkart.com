import Link from "next/link"
import type { ReactNode } from "react"

import { logoutAction } from "../../../lib/customer/actions"
import type { AccountSection } from "../../../lib/themes/types"
import type { CustomerView } from "../../../lib/views"

const NAV: { section: AccountSection; label: string; href: string }[] = [
  { section: "overview", label: "Overview", href: "/account" },
  { section: "orders", label: "Orders", href: "/account/orders" },
  { section: "addresses", label: "Addresses", href: "/account/addresses" },
]

/**
 * Theme-agnostic account layout: greeting + section nav + sign-out, with the
 * active panel as children. Themes wrap this in their own nav/footer/container.
 */
export function AccountShell({
  customer,
  section,
  accent = "#111111",
  children,
}: {
  customer: CustomerView
  section: AccountSection
  accent?: string
  children: ReactNode
}) {
  const name = customer.first_name || customer.email
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 2px", color: "#1c1917" }}>
          Hello, {name}
        </h1>
        <p style={{ fontSize: 13, color: "#78716c", margin: 0 }}>{customer.email}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, alignItems: "start" }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((item) => {
            const active = item.section === section
            return (
              <Link
                key={item.section}
                href={item.href}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#fff" : "#1c1917",
                  background: active ? accent : "transparent",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            )
          })}
          <form action={logoutAction} style={{ marginTop: 4 }}>
            <button
              type="submit"
              style={{
                width: "100%",
                textAlign: "left",
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#b91c1c",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </form>
        </nav>

        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </div>
  )
}
