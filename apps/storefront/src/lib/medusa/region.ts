import "server-only"

import { cache } from "react"

import { getTenantMedusa } from "./client"
import type { TenantResolution } from "../tenant/types"

export type StoreRegion = {
  id: string
  currency_code: string
}

/**
 * Resolves the region used for carts/pricing. Regions are platform-shared
 * (currency + country container, not seller data — Medusa enforces
 * one-country->one-region, so per-tenant regions can't share a country). The
 * first region is used; provisioning creates a single shared region per currency.
 * Memoized per request.
 */
export const getRegion = cache(
  async (tenant: TenantResolution): Promise<StoreRegion | null> => {
    const sdk = getTenantMedusa(tenant)
    const { regions } = await sdk.store.region.list({
      fields: "id,currency_code",
    })
    return (regions?.[0] as StoreRegion) ?? null
  }
)
