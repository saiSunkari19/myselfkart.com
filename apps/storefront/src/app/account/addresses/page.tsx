import { getTheme } from "../../../lib/themes"
import { loadAccountData } from "../../../lib/customer/account-data"

export const dynamic = "force-dynamic"

export default async function AccountAddressesPage() {
  const { config, customer, orders, addresses, countries, cartCount } = await loadAccountData("/account/addresses")
  const Theme = getTheme(config?.template_id)
  return (
    <Theme.Account
      config={config}
      cartCount={cartCount}
      customer={customer}
      section="addresses"
      orders={orders}
      addresses={addresses}
      countries={countries}
    />
  )
}
