import { getTheme } from "../../../lib/themes"
import { loadAccountData } from "../../../lib/customer/account-data"

export const dynamic = "force-dynamic"

export default async function AccountAddressesPage() {
  const { config, customer, orders, addresses, countries } = await loadAccountData("/account/addresses")
  const Theme = getTheme(config?.template_id)
  return (
    <Theme.Account
      config={config}
      customer={customer}
      section="addresses"
      orders={orders}
      addresses={addresses}
      countries={countries}
    />
  )
}
