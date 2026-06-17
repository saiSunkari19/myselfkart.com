import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  extractSellerImportSeeds,
  linkSellerImportProducts,
  parseCsv,
  upsertSellerImportTaxonomy,
} from "../../../../../modules/selfkart-product-import"
import { requireTenantContext } from "../../../../../modules/tenant-context"
import { backfillTenantCurrencyPrices } from "../../../../../scripts/backfill-tenant-currency-prices"
import {
  ensureShippingProfileId,
  linkProductsToShippingProfile,
} from "../../../../../scripts/provision-tenant-commerce"
import { ensureTenantInventoryResources } from "../../../../../scripts/seed-tenant-inventory-resources"

type CompleteBody = {
  csv?: string
  seller_name?: string
  stocked_quantity?: number
}

function readCsv(body: CompleteBody): string {
  if (typeof body.csv === "string" && body.csv.trim()) {
    return body.csv
  }

  throw new Error("csv is required")
}

export async function POST(req: MedusaRequest<CompleteBody>, res: MedusaResponse) {
  const { tenantId } = requireTenantContext()
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerName = req.body.seller_name || "Selfkart Seller"
  const stockedQuantity = Number.isFinite(req.body.stocked_quantity) && Number(req.body.stocked_quantity) > 0
    ? Number(req.body.stocked_quantity)
    : 100
  const rows = parseCsv(readCsv(req.body))
  const seeds = extractSellerImportSeeds(rows, tenantId)
  let linkedProducts = 0

  await knex.transaction(async (trx) => {
    await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
    await upsertSellerImportTaxonomy(trx, tenantId, seeds)
    linkedProducts = await linkSellerImportProducts(trx, seeds.associations)
  })

  // Full post-import heal so an imported catalog is immediately sellable —
  // provisioning ran before these products existed, so it covered none of them:
  //  1. sales channel + stock location + inventory levels (stock)
  //  2. link every product to the default shipping profile (else cart.complete
  //     fails with "cart items require shipping profiles ... not satisfied")
  //  3. ensure a store-currency price on every variant (else the storefront shows
  //     no price when the CSV lacked the store-currency column)
  await ensureTenantInventoryResources(knex, {
    tenantId,
    sellerName,
    stockedQuantity,
  })

  const shippingProfileId = await ensureShippingProfileId(req.scope)
  const linkedShippingProfiles = await linkProductsToShippingProfile(
    knex,
    tenantId,
    shippingProfileId
  )
  const pricedVariants = await backfillTenantCurrencyPrices(req.scope, { tenantId })

  res.status(200).json({
    summary: {
      rows: rows.length,
      linked_products: linkedProducts,
      collections: seeds.collections.length,
      types: seeds.types.length,
      tags: seeds.tags.length,
      categories: seeds.categories.length,
      stocked_quantity: stockedQuantity,
      linked_shipping_profiles: linkedShippingProfiles,
      priced_variants: pricedVariants,
    },
  })
}
