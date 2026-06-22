import "server-only"

import { redirect } from "next/navigation"

import {
  getCurrentCustomer,
  listCustomerAddresses,
  listCustomerOrders,
  type CustomerAddressView,
  type CustomerOrderListItem,
  type CustomerView,
} from "../medusa/customer"
import { getRegion } from "../medusa/region"
import { fetchStoreConfig, type StoreConfig } from "../store-config"
import { resolveTenant } from "../tenant/resolve-tenant"
import { getCustomerToken } from "./cookie"
import { getCartItemCount } from "../cart/item-count"

export type AccountData = {
  config: StoreConfig | null
  customer: CustomerView
  orders: CustomerOrderListItem[]
  addresses: CustomerAddressView[]
  countries: { iso_2: string; display_name?: string | null }[]
  cartCount: number
}

/**
 * Shared loader for the gated /account/* routes: resolve tenant, require a
 * signed-in customer (else redirect to /login), and fetch their orders +
 * addresses + the region's countries.
 */
export async function loadAccountData(next = "/account"): Promise<AccountData> {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") redirect("/")

  const token = await getCustomerToken()
  const customer = await getCurrentCustomer(tenant, token)
  if (!customer || !token) {
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  const [config, orders, addresses, region, cartCount] = await Promise.all([
    fetchStoreConfig(tenant),
    listCustomerOrders(tenant, token),
    listCustomerAddresses(tenant, token),
    getRegion(tenant),
    getCartItemCount(tenant),
  ])

  return {
    config,
    customer,
    orders,
    addresses,
    countries: region?.countries ?? [],
    cartCount,
  }
}
