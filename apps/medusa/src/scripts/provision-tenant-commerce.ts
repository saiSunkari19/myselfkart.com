import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  batchLinksWorkflow,
  createLocationFulfillmentSetWorkflow,
  createRegionsWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateProductsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/core-flows"

import { runWithTenantContext } from "../modules/tenant-context"

/**
 * Provisions the checkout pipeline for one tenant so a buyer can go
 * cart -> shipping -> payment -> completed order on that seller's storefront.
 *
 * Platform-shared (created once, NOT inside tenant context): the region
 * (currency + country + manual payment provider) and the default shipping
 * profile. region is intentionally shared because Medusa enforces
 * one-country->one-region; the sensitive data (prices, shipping rates, payments,
 * orders) is tenant-scoped by RLS.
 *
 * Tenant-scoped (created inside runWithTenantContext, so RLS stamps tenant_id):
 * variant prices, the fulfillment set / service zone / shipping option on the
 * tenant's own stock location, and the manual fulfillment provider link.
 *
 * Idempotent: re-running reuses existing region / fulfillment set / service zone
 * / shipping option / provider link. Pricing is opt-in (see env below) because
 * sellers normally set their own prices via import/admin.
 *
 * Env:
 *   TENANT_ID (or SELLER_ADMIN_TENANT_ID)  required UUID
 *   SELFKART_CURRENCY                       default "usd" (matches seed carts/orders)
 *   SELFKART_COUNTRY                        default "us" (ISO-2, lower-case)
 *   SELFKART_SHIPPING_AMOUNT                default 0 (flat-rate, major units)
 *   SELFKART_PROVISION_PRICE_AMOUNT         if set, applies this flat price (major
 *                                           units) to ALL of the tenant's variants
 *                                           — bootstrap pricing for testing only.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MANUAL_PAYMENT_PROVIDER_ID = "pp_system_default"
const MANUAL_FULFILLMENT_PROVIDER_ID = "manual_manual"

type Input = {
  tenantId: string
  currency: string
  country: string
  shippingAmount: number
  priceAmount: number | null
}

function readInput(): Input {
  const tenantId = process.env.TENANT_ID ?? process.env.SELLER_ADMIN_TENANT_ID ?? ""
  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("TENANT_ID (or SELLER_ADMIN_TENANT_ID) must be a valid UUID")
  }

  const currency = (process.env.SELFKART_CURRENCY ?? "usd").toLowerCase()
  const country = (process.env.SELFKART_COUNTRY ?? "us").toLowerCase()
  const shippingAmount = Number.parseFloat(process.env.SELFKART_SHIPPING_AMOUNT ?? "0")
  if (!Number.isFinite(shippingAmount) || shippingAmount < 0) {
    throw new Error("SELFKART_SHIPPING_AMOUNT must be a non-negative number")
  }

  let priceAmount: number | null = null
  if (process.env.SELFKART_PROVISION_PRICE_AMOUNT !== undefined) {
    priceAmount = Number.parseFloat(process.env.SELFKART_PROVISION_PRICE_AMOUNT)
    if (!Number.isFinite(priceAmount) || priceAmount < 0) {
      throw new Error("SELFKART_PROVISION_PRICE_AMOUNT must be a non-negative number")
    }
  }

  return { tenantId, currency, country, shippingAmount, priceAmount }
}

type Query = {
  graph: (config: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: any[] }>
}

/**
 * Ensures the store lists `currency` in its supported currencies (region
 * creation requires it). Platform-level — no tenant context.
 */
async function ensureStoreCurrency(container: any, currency: string): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const storeModule = container.resolve(Modules.STORE)
  const [store] = await storeModule.listStores({}, { take: 1 })
  if (!store) {
    throw new Error("No store found; run the base Medusa seed/setup first")
  }

  const supported: { currency_code: string; is_default?: boolean }[] =
    store.supported_currencies ?? []
  if (supported.some((c) => c.currency_code === currency)) {
    return
  }

  const next = [
    ...supported.map((c) => ({
      currency_code: c.currency_code,
      is_default: c.is_default,
    })),
    { currency_code: currency, is_default: supported.length === 0 },
  ]

  await updateStoresWorkflow(container).run({
    input: { selector: { id: store.id }, update: { supported_currencies: next } },
  })
  logger.info(`Added supported currency ${currency} to store ${store.id}`)
}

/**
 * Returns the id of the shared region for `currency`, creating it (with the
 * country + manual payment provider) if it doesn't exist. Platform-level.
 */
async function ensureSharedRegion(
  container: any,
  currency: string,
  country: string
): Promise<string> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { currency_code: currency },
  })
  if (regions.length > 0) {
    return regions[0].id
  }

  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: `Selfkart ${currency.toUpperCase()}`,
          currency_code: currency,
          countries: [country],
          payment_providers: [MANUAL_PAYMENT_PROVIDER_ID],
          automatic_taxes: false,
        },
      ],
    },
  })
  logger.info(`Created shared region ${region.id} (${currency}/${country})`)
  return region.id
}

/** Returns the default shipping profile id, creating one if none exists. */
async function ensureShippingProfileId(container: any): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
  })
  const existing = profiles.find((p) => p.type === "default") ?? profiles[0]
  if (existing) {
    return existing.id
  }

  const {
    result: [profile],
  } = await createShippingProfilesWorkflow(container).run({
    input: { data: [{ name: "Default", type: "default" }] },
  })
  return profile.id
}

/** Finds the tenant's own stock location + sales channel (RLS-scoped). */
async function findTenantLocationAndChannel(
  container: any
): Promise<{ stockLocationId: string; salesChannelId: string }> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query

  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "sales_channels.id"],
  })
  if (locations.length === 0) {
    throw new Error(
      "No tenant stock location found. Run seed-tenant-inventory-resources first."
    )
  }
  const location = locations[0]

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
  })
  if (channels.length === 0) {
    throw new Error(
      "No tenant sales channel found. Run seed-tenant-inventory-resources first."
    )
  }

  return { stockLocationId: location.id, salesChannelId: channels[0].id }
}

/** Sets a flat price (in `currency`) on every tenant variant. Bootstrap-only. */
async function provisionVariantPrices(
  container: any,
  currency: string,
  amount: number
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id"],
  })

  const productInputs = products
    .map((p) => ({
      id: p.id,
      variants: (p.variants ?? []).map((v: { id: string }) => ({
        id: v.id,
        prices: [{ amount, currency_code: currency }],
      })),
    }))
    .filter((p) => p.variants.length > 0)

  if (productInputs.length === 0) {
    return
  }

  await updateProductsWorkflow(container).run({
    input: { products: productInputs },
  })
  logger.info(
    `Set ${currency} ${amount} on variants of ${productInputs.length} product(s)`
  )
}

async function ensureSalesChannelLocationLink(
  container: any,
  salesChannelId: string,
  stockLocationId: string
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "stock_locations.id"],
    filters: { id: salesChannelId },
  })
  const linked = (channels[0]?.stock_locations ?? []).some(
    (l: { id: string }) => l.id === stockLocationId
  )
  if (linked) {
    return
  }
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocationId, add: [salesChannelId], remove: [] },
  })
}

async function ensureManualFulfillmentProviderLink(
  container: any,
  stockLocationId: string
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "fulfillment_providers.id"],
    filters: { id: stockLocationId },
  })
  const linked = (locations[0]?.fulfillment_providers ?? []).some(
    (p: { id: string }) => p.id === MANUAL_FULFILLMENT_PROVIDER_ID
  )
  if (linked) {
    return
  }
  await batchLinksWorkflow(container).run({
    input: {
      create: [
        {
          [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
          [Modules.FULFILLMENT]: {
            fulfillment_provider_id: MANUAL_FULFILLMENT_PROVIDER_ID,
          },
        },
      ],
      delete: [],
    },
  })
}

/** Returns the tenant's fulfillment set id for the location, creating it if needed. */
async function ensureFulfillmentSetId(
  container: any,
  stockLocationId: string
): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query

  const read = async (): Promise<string | undefined> => {
    const { data: locations } = await query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id", "fulfillment_sets.type"],
      filters: { id: stockLocationId },
    })
    const sets = locations[0]?.fulfillment_sets ?? []
    const shipping = sets.find((s: { type: string }) => s.type === "shipping") ?? sets[0]
    return shipping?.id
  }

  const existing = await read()
  if (existing) {
    return existing
  }

  await createLocationFulfillmentSetWorkflow(container).run({
    input: {
      location_id: stockLocationId,
      fulfillment_set_data: { name: "Shipping", type: "shipping" },
    },
  })

  const created = await read()
  if (!created) {
    throw new Error("Failed to resolve fulfillment set after creation")
  }
  return created
}

/** Returns a service zone id for the fulfillment set, creating it (country geo zone) if needed. */
async function ensureServiceZoneId(
  container: any,
  fulfillmentSetId: string,
  country: string
): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const { data: sets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "service_zones.id"],
    filters: { id: fulfillmentSetId },
  })
  const existing = (sets[0]?.service_zones ?? [])[0]
  if (existing) {
    return existing.id
  }

  const {
    result: [zone],
  } = await createServiceZonesWorkflow(container).run({
    input: {
      data: [
        {
          name: country.toUpperCase(),
          fulfillment_set_id: fulfillmentSetId,
          geo_zones: [{ type: "country", country_code: country }],
        },
      ],
    },
  })
  return zone.id
}

/** Creates a flat-rate manual shipping option on the service zone if none exists. */
async function ensureShippingOption(
  container: any,
  args: {
    serviceZoneId: string
    shippingProfileId: string
    currency: string
    shippingAmount: number
  }
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "service_zone_id"],
    filters: { service_zone_id: args.serviceZoneId },
  })
  if (options.length > 0) {
    return
  }

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard",
        service_zone_id: args.serviceZoneId,
        shipping_profile_id: args.shippingProfileId,
        provider_id: MANUAL_FULFILLMENT_PROVIDER_ID,
        price_type: "flat",
        type: {
          label: "Standard",
          description: "Standard delivery",
          code: "standard",
        },
        prices: [{ currency_code: args.currency, amount: args.shippingAmount }],
      },
    ],
  })
  logger.info(`Created Standard shipping option on service zone ${args.serviceZoneId}`)
}

export default async function provisionTenantCommerce({
  container,
}: ExecArgs): Promise<void> {
  const input = readInput()
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // --- Platform-shared setup (no tenant context) ---
  await ensureStoreCurrency(container, input.currency)
  const regionId = await ensureSharedRegion(container, input.currency, input.country)
  const shippingProfileId = await ensureShippingProfileId(container)

  // --- Tenant-scoped setup (RLS stamps tenant_id on every write) ---
  await runWithTenantContext({ tenantId: input.tenantId, source: "session" }, async () => {
    const { stockLocationId, salesChannelId } = await findTenantLocationAndChannel(container)

    await ensureSalesChannelLocationLink(container, salesChannelId, stockLocationId)
    await ensureManualFulfillmentProviderLink(container, stockLocationId)

    if (input.priceAmount !== null) {
      await provisionVariantPrices(container, input.currency, input.priceAmount)
    }

    const fulfillmentSetId = await ensureFulfillmentSetId(container, stockLocationId)
    const serviceZoneId = await ensureServiceZoneId(container, fulfillmentSetId, input.country)
    await ensureShippingOption(container, {
      serviceZoneId,
      shippingProfileId,
      currency: input.currency,
      shippingAmount: input.shippingAmount,
    })
  })

  logger.info(
    `Tenant commerce provisioned: tenant_id=${input.tenantId} region=${regionId} currency=${input.currency}`
  )
}
