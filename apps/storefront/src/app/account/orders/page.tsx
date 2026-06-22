import { getTheme } from "../../../lib/themes"
import { loadAccountData } from "../../../lib/customer/account-data"

export const dynamic = "force-dynamic"

export default async function AccountOrdersPage() {
  const { config, customer, orders, addresses, countries, cartCount } = await loadAccountData("/account/orders")
  const Theme = getTheme(config?.template_id)
  return (
    <Theme.Account
      config={config}
      cartCount={cartCount}
      customer={customer}
      section="orders"
      orders={orders}
      addresses={addresses}
      countries={countries}
    />
  )
}
