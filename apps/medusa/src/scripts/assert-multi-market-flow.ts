import assert from "node:assert/strict"

import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"
import { MARKETS, type MarketKey } from "../platform/markets"
import { teardownTenant } from "../platform/repository"
import { provisionTenantCommerceWith } from "./provision-tenant-commerce"
import { provisionTenantStorefrontWith } from "./provision-tenant-storefront"
import {
  ensureTenantInventoryResources,
  tenantSalesChannelId,
} from "./seed-tenant-inventory-resources"

type Query = {
  graph: (config: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: any[] }>
}

type MarketCase = {
  key: Exclude<MarketKey, "india">
  tenantId: string
  host: string
  priceAmount: number
}

const CASES: MarketCase[] = [
  {
    key: "us",
    tenantId: "00000000-0000-0000-0000-0000000000c1",
    host: "assert-us.selfkart.test",
    priceAmount: 101,
  },
  {
    key: "uae",
    tenantId: "00000000-0000-0000-0000-0000000000c2",
    host: "assert-uae.selfkart.test",
    priceAmount: 202,
  },
  {
    key: "europe",
    tenantId: "00000000-0000-0000-0000-0000000000c3",
    host: "assert-europe.selfkart.test",
    priceAmount: 303,
  },
]

function sorted(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b))
}

async function cleanTenant(knex: Knex, tenantId: string): Promise<void> {
  try {
    await teardownTenant(knex, tenantId, { force: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/does not exist|relation .* does not exist/i.test(message)) {
      throw error
    }
  }
}

async function seedProduct(
  container: ExecArgs["container"],
  input: { tenantId: string; marketKey: string; currency: string }
): Promise<void> {
  const salesChannelId = tenantSalesChannelId(input.tenantId)

  await runWithTenantContext({ tenantId: input.tenantId, source: "test" }, async () => {
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: `Assert ${input.marketKey.toUpperCase()} Product`,
            handle: `assert-${input.marketKey}-product`,
            status: "published",
            sales_channels: [{ id: salesChannelId }],
            options: [{ title: "Size", values: ["One Size"] }],
            variants: [
              {
                title: "One Size",
                sku: `assert-${input.marketKey}-sku`,
                options: { Size: "One Size" },
                manage_inventory: true,
                prices: [],
              },
            ],
          },
        ],
      },
    })
  })
}

async function assertSharedRegion(
  query: Query,
  market: (typeof MARKETS)[MarketKey]
): Promise<void> {
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code", "countries.iso_2"],
  })
  const region = regions.find((r) => r.currency_code === market.currency)
  assert.ok(region, `${market.currency} region must exist after provisioning`)

  const actualCountries = sorted(
    (region.countries ?? []).map((c: { iso_2: string }) => c.iso_2)
  )
  assert.deepEqual(
    actualCountries,
    sorted(market.countries),
    `${market.currency} region must cover the configured market countries`
  )
}

async function assertTenantRows(
  knex: Knex,
  input: { tenantId: string; currency: string; country: string; host: string }
): Promise<void> {
  const tenant = await knex("tenants").where({ id: input.tenantId }).first()
  assert.ok(tenant, `${input.tenantId} tenant registry row must exist`)
  assert.equal(tenant.currency, input.currency, "tenant currency must be stamped")
  assert.equal(tenant.country, input.country, "tenant primary country must be stamped")

  const domain = await knex("tenant_domains")
    .where({ tenant_id: input.tenantId, host: input.host, is_primary: true })
    .first("publishable_key")
  assert.ok(domain?.publishable_key, "tenant domain must have a publishable key")
}

async function assertTenantCommerce(
  knex: Knex,
  input: {
    tenantId: string
    currency: string
    countries: string[]
    priceAmount: number
  }
): Promise<void> {
  await runWithTenantContext({ tenantId: input.tenantId, source: "test" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [input.tenantId])

      const products = await trx("product")
        .where({ tenant_id: input.tenantId, status: "published" })
        .whereNull("deleted_at")
        .select("id")
      assert.equal(products.length, 1, "tenant must see its published test product")

      const prices = await trx("product_variant as pv")
        .join("product as p", "p.id", "pv.product_id")
        .join("product_variant_price_set as pvps", "pvps.variant_id", "pv.id")
        .join("price_set as ps", "ps.id", "pvps.price_set_id")
        .join("price as pr", "pr.price_set_id", "ps.id")
        .where("p.tenant_id", input.tenantId)
        .where("pr.currency_code", input.currency)
        .whereNull("p.deleted_at")
        .whereNull("pv.deleted_at")
        .whereNull("pvps.deleted_at")
        .whereNull("ps.deleted_at")
        .whereNull("pr.deleted_at")
        .select("pr.amount")
      assert.equal(prices.length, 1, "tenant variant must have one market-currency price")
      assert.equal(
        Number(prices[0].amount),
        input.priceAmount,
        "tenant variant price must match provisioning amount"
      )

      const shippingCountries = await trx("shipping_option as so")
        .join("service_zone as sz", "sz.id", "so.service_zone_id")
        .join("geo_zone as gz", "gz.service_zone_id", "sz.id")
        .where("so.tenant_id", input.tenantId)
        .where("sz.tenant_id", input.tenantId)
        .whereNull("so.deleted_at")
        .whereNull("sz.deleted_at")
        .whereNull("gz.deleted_at")
        .pluck("gz.country_code")
      assert.deepEqual(
        sorted(shippingCountries.map(String)),
        sorted(input.countries),
        "tenant shipping zone must cover the configured market countries"
      )

      const noContext = await knex("product").where({ tenant_id: input.tenantId }).select("id")
      assert.equal(noContext.length, 0, "no-context reads must not see tenant products")
    })
  })
}

export default async function assertMultiMarketFlow({
  container,
}: ExecArgs): Promise<void> {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Multi-market assertions: provisioning US, UAE, and Europe")

  try {
    for (const testCase of CASES) {
      await cleanTenant(knex, testCase.tenantId)

      const market = MARKETS[testCase.key]
      const sellerName = `Assert ${market.label} Seller`

      await ensureTenantInventoryResources(knex, {
        tenantId: testCase.tenantId,
        sellerName,
        stockedQuantity: 100,
      })
      await provisionTenantStorefrontWith(container, {
        tenantId: testCase.tenantId,
        host: testCase.host,
        sellerName,
        slug: `assert-${testCase.key}`,
        status: "active",
        currency: market.currency,
        country: market.primaryCountry,
      })
      await seedProduct(container, {
        tenantId: testCase.tenantId,
        marketKey: testCase.key,
        currency: market.currency,
      })
      await ensureTenantInventoryResources(knex, {
        tenantId: testCase.tenantId,
        sellerName,
        stockedQuantity: 100,
      })
      await provisionTenantCommerceWith(container, {
        tenantId: testCase.tenantId,
        currency: market.currency,
        country: market.primaryCountry,
        shippingAmount: 0,
        priceAmount: testCase.priceAmount,
      })

      await assertTenantRows(knex, {
        tenantId: testCase.tenantId,
        currency: market.currency,
        country: market.primaryCountry,
        host: testCase.host,
      })
      await assertSharedRegion(query, market)
      await assertTenantCommerce(knex, {
        tenantId: testCase.tenantId,
        currency: market.currency,
        countries: market.countries,
        priceAmount: testCase.priceAmount,
      })

      logger.info(
        `Market assertion passed: ${market.label} (${market.currency}/${market.primaryCountry})`
      )
    }
  } finally {
    for (const testCase of CASES) {
      await cleanTenant(knex, testCase.tenantId)
    }
  }

  logger.info("All multi-market assertions passed.")
}
