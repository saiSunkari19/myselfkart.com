import { createHash } from "node:crypto"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Input = {
  tenantId: string
  sellerName: string
  stockedQuantity: number
}

function readInput(): Input {
  const tenantId = process.env.SELLER_ADMIN_TENANT_ID ?? process.env.TENANT_ID ?? ""
  const sellerName = process.env.SELLER_NAME ?? "Selfkart Seller"
  const stockedQuantity = Number.parseInt(process.env.STOCKED_QUANTITY ?? "100", 10)

  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("SELLER_ADMIN_TENANT_ID or TENANT_ID must be a valid UUID")
  }

  if (!Number.isFinite(stockedQuantity) || stockedQuantity <= 0) {
    throw new Error("STOCKED_QUANTITY must be a positive integer")
  }

  return { tenantId, sellerName, stockedQuantity }
}

function stableId(prefix: string, ...parts: string[]): string {
  const hash = createHash("sha1").update(parts.join(":")).digest("hex").slice(0, 24)
  return `${prefix}_${hash}`
}

function rawQuantity(value: number): string {
  return JSON.stringify({ value: String(value), precision: 20 })
}

function seededMetadata(kind: string, tenantId: string): string {
  return JSON.stringify({ selfkart_seeded: true, kind, tenant_id: tenantId })
}

async function upsertTenantSalesChannel(
  trx: Knex.Transaction,
  tenantId: string,
  sellerName: string
): Promise<string> {
  const name = `${sellerName} Sales Channel`
  const existing = await trx("sales_channel").where({ name }).first("id")

  if (existing?.id) {
    return existing.id
  }

  const id = stableId("sc_selfkart", tenantId)
  await trx("sales_channel").insert({
    id,
    name,
    description: `Tenant sales channel for ${sellerName}`,
    is_disabled: false,
    metadata: seededMetadata("sales_channel", tenantId),
  })

  return id
}

async function upsertTenantStockLocation(
  trx: Knex.Transaction,
  tenantId: string,
  sellerName: string
): Promise<string> {
  const name = `${sellerName} Stock Location`
  const existing = await trx("stock_location").where({ name }).first("id")

  if (existing?.id) {
    return existing.id
  }

  const id = stableId("sloc_selfkart", tenantId)
  await trx("stock_location").insert({
    id,
    name,
    metadata: seededMetadata("stock_location", tenantId),
  })

  return id
}

async function linkProductsToSalesChannel(trx: Knex.Transaction, salesChannelId: string) {
  const products = await trx("product").select("id")

  for (const product of products) {
    const exists = await trx("product_sales_channel")
      .where({
        product_id: product.id,
        sales_channel_id: salesChannelId,
      })
      .first("id")

    if (exists) {
      continue
    }

    await trx("product_sales_channel").insert({
      id: stableId("prodsc_selfkart", product.id, salesChannelId),
      product_id: product.id,
      sales_channel_id: salesChannelId,
    })
  }
}

async function linkSalesChannelToStockLocation(
  trx: Knex.Transaction,
  salesChannelId: string,
  stockLocationId: string
) {
  const exists = await trx("sales_channel_stock_location")
    .where({
      sales_channel_id: salesChannelId,
      stock_location_id: stockLocationId,
    })
    .first("id")

  if (exists) {
    return
  }

  await trx("sales_channel_stock_location").insert({
    id: stableId("scsloc_selfkart", salesChannelId, stockLocationId),
    sales_channel_id: salesChannelId,
    stock_location_id: stockLocationId,
  })
}

async function ensureInventoryLevels(
  trx: Knex.Transaction,
  tenantId: string,
  stockLocationId: string,
  stockedQuantity: number
) {
  const inventoryItems = await trx("inventory_item as ii")
    .select("ii.id")
    .whereExists(function () {
      this.select(trx.raw("1"))
        .from("product_variant_inventory_item as pvii")
        .whereRaw('pvii."inventory_item_id" = ii."id"')
        .whereNull("pvii.deleted_at")
    })
    .whereNull("ii.deleted_at")

  for (const item of inventoryItems) {
    const existing = await trx("inventory_level")
      .where({
        inventory_item_id: item.id,
        location_id: stockLocationId,
      })
      .first("id")

    if (existing) {
      await trx("inventory_level")
        .where({ id: existing.id })
        .update({
          stocked_quantity: stockedQuantity,
          raw_stocked_quantity: rawQuantity(stockedQuantity),
          updated_at: trx.fn.now(),
        })
      continue
    }

    await trx("inventory_level").insert({
      id: stableId("ilev_selfkart", item.id, stockLocationId),
      inventory_item_id: item.id,
      location_id: stockLocationId,
      stocked_quantity: stockedQuantity,
      reserved_quantity: 0,
      incoming_quantity: 0,
      raw_stocked_quantity: rawQuantity(stockedQuantity),
      raw_reserved_quantity: rawQuantity(0),
      raw_incoming_quantity: rawQuantity(0),
      metadata: seededMetadata("inventory_level", tenantId),
    })
  }
}

export async function ensureTenantInventoryResources(
  knex: Knex,
  input: Input
): Promise<void> {
  await runWithTenantContext({ tenantId: input.tenantId, source: "session" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [input.tenantId])

      const salesChannelId = await upsertTenantSalesChannel(
        trx,
        input.tenantId,
        input.sellerName
      )
      const stockLocationId = await upsertTenantStockLocation(
        trx,
        input.tenantId,
        input.sellerName
      )

      await linkProductsToSalesChannel(trx, salesChannelId)
      await linkSalesChannelToStockLocation(trx, salesChannelId, stockLocationId)
      await ensureInventoryLevels(
        trx,
        input.tenantId,
        stockLocationId,
        input.stockedQuantity
      )
    })
  })
}

export default async function seedTenantInventoryResources({
  container,
}: ExecArgs): Promise<void> {
  const input = readInput()
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  await ensureTenantInventoryResources(knex, input)
  logger.info(
    `Tenant inventory resources ready: tenant_id=${input.tenantId} seller=${input.sellerName}`
  )
}
