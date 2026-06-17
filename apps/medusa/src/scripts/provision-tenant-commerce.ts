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
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/core-flows"

import { runWithTenantContext } from "../modules/tenant-context"
import { countriesForCurrency } from "../platform/markets"
import { stableId } from "./seed-tenant-inventory-resources"
import type { Knex } from "knex"

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
const RAZORPAY_PAYMENT_PROVIDER_ID = "pp_razorpay_razorpay"
const MANUAL_FULFILLMENT_PROVIDER_ID = "manual_manual"

// Every shared region offers both providers. Regions are shared by currency
// across tenants, so a tenant that hasn't configured Razorpay simply never sees
// it on the storefront (the storefront gates on tenant_payment_credentials), and
// the provider itself fails closed if an unconfigured tenant tries to use it.
const REGION_PAYMENT_PROVIDERS = [
  MANUAL_PAYMENT_PROVIDER_ID,
  RAZORPAY_PAYMENT_PROVIDER_ID,
]

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
 * Ensures a region offers every provider in REGION_PAYMENT_PROVIDERS. Idempotent:
 * reads the region's current providers and only writes (replacing the set) when
 * one is missing — so re-runs are no-ops and existing regions get backfilled.
 */
async function ensureRegionPaymentProviders(
  container: any,
  regionId: string
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "payment_providers.id"],
    filters: { id: regionId },
  })
  const current = new Set<string>(
    (regions[0]?.payment_providers ?? []).map((p: { id: string }) => p.id)
  )
  const missing = REGION_PAYMENT_PROVIDERS.filter((p) => !current.has(p))
  if (missing.length === 0) {
    return
  }
  await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: regionId },
      update: { payment_providers: [...current, ...missing] },
    },
  })
  logger.info(
    `Linked payment providers '${missing.join(",")}' to region ${regionId}`
  )
}

/** Replaces a region's country list (used to move a country between regions). */
async function setRegionCountries(
  container: any,
  regionId: string,
  countries: string[]
): Promise<void> {
  await updateRegionsWorkflow(container).run({
    input: { selector: { id: regionId }, update: { countries } },
  })
}

/**
 * Returns the id of the shared region for `currency`, ensuring it covers EVERY
 * country in `countries` (a market may span several — e.g. the EUR region serves
 * the Core EU set). Creates the region if none exists for the currency.
 * Platform-level.
 *
 * Medusa enforces that a country belongs to exactly ONE region globally, so we
 * look across ALL regions (not just the currency match): if a wanted country is
 * held by a different-currency region, we detach it there before attaching it to
 * the correct currency region. This makes provisioning idempotent and prevents
 * the "Countries with codes ... are already assigned to a region" failure.
 */
async function ensureSharedRegion(
  container: any,
  currency: string,
  countries: string[]
): Promise<string> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query

  const wanted = Array.from(
    new Set(countries.map((c) => c.trim().toLowerCase()).filter(Boolean))
  )
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code", "countries.iso_2"],
  })

  const countriesOf = (r: any): string[] =>
    (r.countries ?? []).map((c: { iso_2: string }) => c.iso_2)

  // Detaches `norm` from whatever region currently owns it (other than
  // `keepRegionId`), keeping the local `regions` cache in sync so a later
  // iteration sees the removal. Returns true if it had to move it.
  const freeCountry = async (norm: string, keepRegionId?: string): Promise<void> => {
    const owner = regions.find(
      (r) => r.id !== keepRegionId && countriesOf(r).includes(norm)
    )
    if (!owner) {
      return
    }
    const remaining = countriesOf(owner).filter((c) => c !== norm)
    await setRegionCountries(container, owner.id, remaining)
    owner.countries = remaining.map((iso_2: string) => ({ iso_2 }))
    logger.warn(
      `Moved country '${norm}' off region ${owner.id} (${owner.currency_code}) ` +
        `to the ${currency} region`
    )
  }

  const byCurrency = regions.find((r) => r.currency_code === currency)

  if (byCurrency) {
    const have = new Set(countriesOf(byCurrency))
    const missing = wanted.filter((c) => !have.has(c))
    if (missing.length > 0) {
      for (const norm of missing) {
        await freeCountry(norm, byCurrency.id)
      }
      await setRegionCountries(container, byCurrency.id, [...have, ...missing])
      logger.info(
        `Added countries '${missing.join(",")}' to shared region ${byCurrency.id} (${currency})`
      )
    }
    await ensureRegionPaymentProviders(container, byCurrency.id)
    return byCurrency.id
  }

  // No region for this currency yet: free every wanted country from existing
  // owners so creation doesn't hit the one-country->one-region constraint.
  for (const norm of wanted) {
    await freeCountry(norm)
  }

  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: `Selfkart ${currency.toUpperCase()}`,
          currency_code: currency,
          countries: wanted,
          payment_providers: REGION_PAYMENT_PROVIDERS,
          automatic_taxes: false,
        },
      ],
    },
  })
  logger.info(`Created shared region ${region.id} (${currency}/${wanted.join(",")})`)
  return region.id
}

/** Returns the default shipping profile id, creating one if none exists. */
export async function ensureShippingProfileId(container: any): Promise<string> {
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
  stockLocationId: string,
  tenantId: string
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
      // fulfillment_set.name has a GLOBAL unique index (Medusa core,
      // IDX_fulfillment_set_name_unique) — not tenant-scoped — so a fixed
      // "Shipping" collides for the second tenant onward. Namespace it per tenant.
      fulfillment_set_data: { name: `Shipping ${tenantId}`, type: "shipping" },
    },
  })

  const created = await read()
  if (!created) {
    throw new Error("Failed to resolve fulfillment set after creation")
  }
  return created
}

/**
 * Returns a service zone id for the fulfillment set, creating it with a country
 * geo-zone for EVERY market country if needed (so a shipping option on the zone
 * is available to a buyer in any of them — e.g. all Core EU countries).
 */
async function ensureServiceZoneId(
  container: any,
  fulfillmentSetId: string,
  countries: string[],
  tenantId: string
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

  const geoCountries = Array.from(
    new Set(countries.map((c) => c.trim().toLowerCase()).filter(Boolean))
  )

  const {
    result: [zone],
  } = await createServiceZonesWorkflow(container).run({
    input: {
      data: [
        {
          // service_zone.name also has a GLOBAL unique index
          // (IDX_service_zone_name_unique), so a fixed/country name collides when
          // two tenants share a country. Namespace it per tenant.
          name: `Zone ${tenantId}`,
          fulfillment_set_id: fulfillmentSetId,
          geo_zones: geoCountries.map((country_code) => ({
            type: "country" as const,
            country_code,
          })),
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

/**
 * Links every tenant product to the default shipping profile. CSV-imported
 * products are NOT auto-linked to a shipping profile (only admin-created products
 * are), so without this `cart.complete` fails with "cart items require shipping
 * profiles that are not satisfied by the current shipping methods". Runs inside
 * the tenant context (RLS scopes `product` to this tenant, and the
 * product_shipping_profile insert satisfies the tenant-derived WITH CHECK).
 */
export async function linkProductsToShippingProfile(
  knex: Knex,
  tenantId: string,
  shippingProfileId: string
): Promise<number> {
  return runWithTenantContext({ tenantId, source: "session" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      const products = await trx("product").select("id").whereNull("deleted_at")
      let linked = 0
      for (const product of products) {
        const exists = await trx("product_shipping_profile")
          .where({ product_id: product.id, shipping_profile_id: shippingProfileId })
          .whereNull("deleted_at")
          .first("id")
        if (exists) {
          continue
        }
        await trx("product_shipping_profile").insert({
          id: stableId("prodsp_selfkart", product.id, shippingProfileId),
          product_id: product.id,
          shipping_profile_id: shippingProfileId,
        })
        linked++
      }
      return linked
    })
  })
}

/**
 * Callable form used by the platform onboarding orchestrator (provision-seller).
 * The CLI default export below reads env into `input` and delegates here.
 */
export async function provisionTenantCommerceWith(
  container: ExecArgs["container"],
  input: Input
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  // --- Platform-shared setup (no tenant context) ---
  // A market may span several countries (e.g. the EUR region serves the Core EU
  // set); the region + shipping zone cover all of them. Falls back to the single
  // provisioning country for an unknown/custom currency.
  const marketCountries = countriesForCurrency(input.currency, input.country)
  await ensureStoreCurrency(container, input.currency)
  const regionId = await ensureSharedRegion(container, input.currency, marketCountries)
  const shippingProfileId = await ensureShippingProfileId(container)

  // --- Tenant-scoped setup (RLS stamps tenant_id on every write) ---
  await runWithTenantContext({ tenantId: input.tenantId, source: "session" }, async () => {
    const { stockLocationId, salesChannelId } = await findTenantLocationAndChannel(container)

    await ensureSalesChannelLocationLink(container, salesChannelId, stockLocationId)
    await ensureManualFulfillmentProviderLink(container, stockLocationId)

    if (input.priceAmount !== null) {
      await provisionVariantPrices(container, input.currency, input.priceAmount)
    }

    const fulfillmentSetId = await ensureFulfillmentSetId(
      container,
      stockLocationId,
      input.tenantId
    )
    const serviceZoneId = await ensureServiceZoneId(
      container,
      fulfillmentSetId,
      marketCountries,
      input.tenantId
    )
    await ensureShippingOption(container, {
      serviceZoneId,
      shippingProfileId,
      currency: input.currency,
      shippingAmount: input.shippingAmount,
    })
  })

  // Link the tenant's products to the default shipping profile so checkout can
  // complete (own tenant context + transaction; see the function doc).
  const linkedProfiles = await linkProductsToShippingProfile(
    knex,
    input.tenantId,
    shippingProfileId
  )

  logger.info(
    `Tenant commerce provisioned: tenant_id=${input.tenantId} region=${regionId} ` +
      `currency=${input.currency} products_linked_to_shipping_profile=${linkedProfiles}`
  )
}

export default async function provisionTenantCommerce({
  container,
}: ExecArgs): Promise<void> {
  await provisionTenantCommerceWith(container, readInput())
}
