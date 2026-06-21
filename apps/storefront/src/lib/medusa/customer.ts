import "server-only"

import { getTenantMedusa } from "./client"
import type { TenantResolution } from "../tenant/types"

/**
 * Customer data layer — authenticated /store/customers/me* + /store/orders calls.
 *
 * Every call is scoped to the signed-in buyer via their token (attached by
 * getTenantMedusa) AND to the tenant via the signed headers + Postgres RLS. A
 * token from another tenant resolves to nothing, so reads fail closed.
 */

export type CustomerView = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
}

export type CustomerAddressView = {
  id: string
  address_name: string | null
  first_name: string | null
  last_name: string | null
  company: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country_code: string | null
  phone: string | null
  is_default_shipping: boolean
  is_default_billing: boolean
}

export type CustomerOrderListItem = {
  id: string
  display_id: number
  status: string | null
  fulfillment_status: string | null
  payment_status: string | null
  total: number
  currency_code: string
  created_at: string | null
  item_count: number
  thumbnails: string[]
}

const ORDER_LIST_FIELDS =
  "id,display_id,status,fulfillment_status,payment_status,total,currency_code,created_at,items.id,items.title,items.quantity,items.thumbnail"

function mapAddress(a: any): CustomerAddressView {
  return {
    id: a.id,
    address_name: a.address_name ?? null,
    first_name: a.first_name ?? null,
    last_name: a.last_name ?? null,
    company: a.company ?? null,
    address_1: a.address_1 ?? null,
    address_2: a.address_2 ?? null,
    city: a.city ?? null,
    province: a.province ?? null,
    postal_code: a.postal_code ?? null,
    country_code: a.country_code ?? null,
    phone: a.phone ?? null,
    is_default_shipping: Boolean(a.is_default_shipping),
    is_default_billing: Boolean(a.is_default_billing),
  }
}

function mapOrderListItem(o: any): CustomerOrderListItem {
  const items = (o.items ?? []) as any[]
  return {
    id: o.id,
    display_id: o.display_id,
    status: o.status ?? null,
    fulfillment_status: o.fulfillment_status ?? null,
    payment_status: o.payment_status ?? null,
    total: o.total ?? 0,
    currency_code: o.currency_code,
    created_at: o.created_at ?? null,
    item_count: items.reduce((n, it) => n + (it.quantity ?? 0), 0),
    thumbnails: items.map((it) => it.thumbnail).filter(Boolean).slice(0, 4),
  }
}

/** The signed-in customer for this tenant, or null (not logged in / token invalid / cross-tenant). */
export async function getCurrentCustomer(
  tenant: TenantResolution,
  token: string | null
): Promise<CustomerView | null> {
  if (!token) return null
  try {
    const sdk = getTenantMedusa(tenant, token)
    const { customer } = await sdk.store.customer.retrieve()
    if (!customer?.id) return null
    return {
      id: customer.id,
      email: customer.email ?? "",
      first_name: customer.first_name ?? null,
      last_name: customer.last_name ?? null,
      phone: customer.phone ?? null,
    }
  } catch {
    return null
  }
}

export async function listCustomerOrders(
  tenant: TenantResolution,
  token: string | null
): Promise<CustomerOrderListItem[]> {
  if (!token) return []
  try {
    const sdk = getTenantMedusa(tenant, token)
    const { orders } = await sdk.store.order.list({
      limit: 50,
      offset: 0,
      order: "-created_at",
      fields: ORDER_LIST_FIELDS,
    })
    return (orders ?? []).map(mapOrderListItem)
  } catch {
    return []
  }
}

export async function listCustomerAddresses(
  tenant: TenantResolution,
  token: string | null
): Promise<CustomerAddressView[]> {
  if (!token) return []
  try {
    const sdk = getTenantMedusa(tenant, token)
    const { addresses } = await sdk.store.customer.listAddress({ limit: 100 })
    return (addresses ?? []).map(mapAddress)
  } catch {
    return []
  }
}

export type AddressInput = {
  address_name?: string
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
  phone?: string
}

export async function createCustomerAddress(
  tenant: TenantResolution,
  token: string,
  input: AddressInput
): Promise<void> {
  const sdk = getTenantMedusa(tenant, token)
  await sdk.store.customer.createAddress(input)
}

export async function updateCustomerAddress(
  tenant: TenantResolution,
  token: string,
  addressId: string,
  input: AddressInput
): Promise<void> {
  const sdk = getTenantMedusa(tenant, token)
  await sdk.store.customer.updateAddress(addressId, input)
}

export async function deleteCustomerAddress(
  tenant: TenantResolution,
  token: string,
  addressId: string
): Promise<void> {
  const sdk = getTenantMedusa(tenant, token)
  await sdk.store.customer.deleteAddress(addressId)
}

export async function updateCustomerProfile(
  tenant: TenantResolution,
  token: string,
  input: { first_name?: string; last_name?: string; phone?: string }
): Promise<void> {
  const sdk = getTenantMedusa(tenant, token)
  await sdk.store.customer.update(input)
}
