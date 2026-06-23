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

export function stableId(prefix: string, ...parts: string[]): string {
  const hash = createHash("sha1").update(parts.join(":")).digest("hex").slice(0, 24)
  return `${prefix}_${hash}`
}

/**
 * Deterministic id of a tenant's own sales channel. The seed creates the channel
 * with exactly this id (see `upsertTenantSalesChannel`), so any other script can
 * resolve a tenant's channel by id alone — without depending on RLS visibility or
 * "first by created_at", which is what let publishable keys cross-link to the
 * wrong tenant's sales channel.
 */
export function tenantSalesChannelId(tenantId: string): string {
  return stableId("sc_selfkart", tenantId)
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
  // Upsert by the deterministic, tenant-namespaced id (not by name): re-seeding
  // the same tenant must reuse its channel instead of colliding on
  // sales_channel_pkey, and must refresh the name/description so the row reflects
  // the current seller name. The row is owned by this tenant, so the ON CONFLICT
  // update passes RLS (it runs inside this tenant's context).
  const id = stableId("sc_selfkart", tenantId)
  const channelName = `${sellerName} Sales Channel`
  const channelDescription = `Tenant sales channel for ${sellerName}`

  await trx("sales_channel")
    .insert({
      id,
      name: channelName,
      description: channelDescription,
      is_disabled: false,
      metadata: seededMetadata("sales_channel", tenantId),
    })
    .onConflict("id")
    .merge({ name: channelName, description: channelDescription })

  return id
}

async function upsertTenantStockLocation(
  trx: Knex.Transaction,
  tenantId: string,
  sellerName: string
): Promise<string> {
  const id = stableId("sloc_selfkart", tenantId)
  const locationName = `${sellerName} Stock Location`

  await trx("stock_location")
    .insert({
      id,
      name: locationName,
      metadata: seededMetadata("stock_location", tenantId),
    })
    .onConflict("id")
    .merge({ name: locationName })

  return id
}

async function linkProductsToSalesChannel(
  trx: Knex.Transaction,
  tenantId: string,
  salesChannelId: string
) {
  const products = await trx("product").select("id").where({ tenant_id: tenantId })

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
        .join("product_variant as pv", "pv.id", "pvii.variant_id")
        .join("product as p", "p.id", "pv.product_id")
        .whereRaw('pvii."inventory_item_id" = ii."id"')
        .where("p.tenant_id", tenantId)
        .whereNull("p.deleted_at")
        .whereNull("pv.deleted_at")
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

/**
 * Backfills inventory levels for specific variants at the tenant's stock
 * location, **creating only what is missing**. Unlike {@link ensureInventoryLevels}
 * (a bootstrap that resets every level to a flat value), this never touches an
 * existing level, so it is safe to run on every variant creation — it only fills
 * variants that have none. Returns the number of levels created.
 *
 * No-ops (returns 0) when the tenant has no seeded stock location yet
 * (onboarding owns location creation), so creating a product before provisioning
 * never errors here.
 */
export async function ensureVariantInventoryLevels(
  knex: Knex,
  input: { tenantId: string; variantIds: string[]; stockedQuantity: number }
): Promise<number> {
  const { tenantId, variantIds } = input
  const stockedQuantity =
    Number.isFinite(input.stockedQuantity) && input.stockedQuantity > 0
      ? input.stockedQuantity
      : 100
  if (variantIds.length === 0) {
    return 0
  }

  let created = 0
  await runWithTenantContext({ tenantId, source: "session" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])

      const stockLocationId = stableId("sloc_selfkart", tenantId)
      const location = await trx("stock_location")
        .where({ id: stockLocationId })
        .whereNull("deleted_at")
        .first("id")
      if (!location) {
        return
      }

      // variant -> inventory item, scoped to this tenant's own products.
      const itemRows = await trx("product_variant_inventory_item as pvii")
        .join("product_variant as pv", "pv.id", "pvii.variant_id")
        .join("product as p", "p.id", "pv.product_id")
        .whereIn("pvii.variant_id", variantIds)
        .where("p.tenant_id", tenantId)
        .whereNull("pvii.deleted_at")
        .whereNull("pv.deleted_at")
        .whereNull("p.deleted_at")
        .distinct("pvii.inventory_item_id as inventory_item_id")

      for (const { inventory_item_id } of itemRows) {
        const existing = await trx("inventory_level")
          .where({ inventory_item_id, location_id: stockLocationId })
          .first("id")
        if (existing) {
          continue
        }

        await trx("inventory_level").insert({
          id: stableId("ilev_selfkart", inventory_item_id, stockLocationId),
          inventory_item_id,
          location_id: stockLocationId,
          stocked_quantity: stockedQuantity,
          reserved_quantity: 0,
          incoming_quantity: 0,
          raw_stocked_quantity: rawQuantity(stockedQuantity),
          raw_reserved_quantity: rawQuantity(0),
          raw_incoming_quantity: rawQuantity(0),
          metadata: seededMetadata("inventory_level", tenantId),
        })
        created += 1
      }
    })
  })

  return created
}

/**
 * Rewrites each tenant inventory item's title to be **product-aware**.
 *
 * Medusa's core product import names the inventory item after the *variant*
 * title (`create-product-variants` → `title: variantInput.title`). For a
 * single-variant product the variant is "Default", so the Inventory list shows
 * "Default"; for multi-variant products it shows the bare option value ("M",
 * "200 ml") — never the product. This backfill makes the item recognisable:
 *
 *   - single / unnamed variant → `<Product Title>`
 *   - real variant title       → `<Product Title> - <Variant Title>`
 *
 * Idempotent and tenant-scoped: only touches rows whose title would change, so
 * re-running an import is a no-op once titles are correct.
 */
async function ensureInventoryItemTitles(trx: Knex.Transaction, tenantId: string) {
  await trx.raw(
    `update inventory_item ii
        set title = computed.new_title,
            updated_at = now()
       from (
         select pvii.inventory_item_id as item_id,
                case
                  when pv.title is not null and pv.title <> '' and pv.title <> 'Default'
                  then p.title || ' - ' || pv.title
                  else p.title
                end as new_title
           from product_variant_inventory_item pvii
           join product_variant pv on pv.id = pvii.variant_id
           join product p on p.id = pv.product_id
          where p.tenant_id = ?
            and pvii.deleted_at is null
            and pv.deleted_at is null
            and p.deleted_at is null
       ) as computed
      where ii.id = computed.item_id
        and ii.deleted_at is null
        and ii.title is distinct from computed.new_title`,
    [tenantId]
  )
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

      await linkProductsToSalesChannel(trx, input.tenantId, salesChannelId)
      await linkSalesChannelToStockLocation(trx, salesChannelId, stockLocationId)
      await ensureInventoryLevels(
        trx,
        input.tenantId,
        stockLocationId,
        input.stockedQuantity
      )
      await ensureInventoryItemTitles(trx, input.tenantId)
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
