import "server-only"

import { cache } from "react"

import { getTenantMedusa } from "./client"
import type { TenantResolution } from "../tenant/types"

export type StoreCountry = {
  iso_2: string
  display_name?: string
}

export type StoreRegion = {
  id: string
  currency_code: string
  countries: StoreCountry[]
}

/**
 * Resolves the region used for carts/pricing. Regions are platform-shared
 * (currency + country container, not seller data — Medusa enforces
 * one-country->one-region, so per-tenant regions can't share a country).
 * Provisioning creates a single shared region per currency.
 *
 * Selection order:
 *  1. The region whose `currency_code` matches the tenant's market currency
 *     (set on the tenant at provisioning). This is the only correct choice once
 *     more than one market is live — otherwise an INR store could resolve to the
 *     USD region.
 *  2. Else the first *checkout-capable* region (has at least one country): a
 *     region with no countries can never accept a shipping address, so a cart
 *     there fails with "Country … is not within region …".
 *  3. Else the first region, so a single-region store still resolves.
 * Memoized per request.
 */
export const getRegion = cache(
  async (tenant: TenantResolution): Promise<StoreRegion | null> => {
    const sdk = getTenantMedusa(tenant)
    const { regions } = await sdk.store.region.list({
      fields: "id,currency_code,countries.iso_2,countries.display_name",
    })
    if (!regions?.length) {
      return null
    }
    const byCurrency = tenant.currency
      ? regions.find(
          (r: { currency_code?: string }) =>
            r.currency_code?.toLowerCase() === tenant.currency
        )
      : undefined
    const usable = regions.find(
      (r: { countries?: unknown[] }) => (r.countries?.length ?? 0) > 0
    )
    return ((byCurrency ?? usable ?? regions[0]) as StoreRegion) ?? null
  }
)
