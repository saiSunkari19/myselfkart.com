import Link from "next/link"

import type { AccountProps } from "../../../lib/themes/types"
import { AccountShell } from "./account-shell"
import { AddressesManager } from "./addresses-manager"
import { OrdersList } from "./orders-list"
import { ProfileForm } from "./profile-form"

/**
 * The full account body (nav + active panel) for a given section. Themes render
 * this inside their own chrome and pass their accent colour — so the account
 * dashboard is implemented once and skinned per template.
 */
export function AccountContent({
  customer,
  section,
  orders,
  addresses,
  countries,
  accent = "#111111",
}: AccountProps & { accent?: string }) {
  return (
    <AccountShell customer={customer} section={section} accent={accent}>
      {section === "orders" ? (
        <OrdersList orders={orders} />
      ) : section === "addresses" ? (
        <AddressesManager addresses={addresses} countries={countries} accent={accent} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ProfileForm customer={customer} accent={accent} />
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#1c1917" }}>Recent orders</h2>
              <Link href="/account/orders" style={{ fontSize: 13, fontWeight: 600, color: accent }}>View all →</Link>
            </div>
            <OrdersList orders={orders.slice(0, 3)} />
          </div>
        </div>
      )}
    </AccountShell>
  )
}
