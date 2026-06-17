import {
  createProductsWorkflow,
  createProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { getTenantContext } from "../../modules/tenant-context"
import { ensureVariantInventoryLevels } from "../../scripts/seed-tenant-inventory-resources"

const DEFAULT_STOCKED_QUANTITY = (() => {
  const parsed = Number.parseInt(process.env.STOCKED_QUANTITY ?? "100", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100
})()

/**
 * Sellers create products in Admin, not via the CLI seed. Admin product/variant
 * creation creates an inventory *item* but no inventory *level*, so add-to-cart
 * fails with "Sales channel … is not associated with any stock location for
 * variant …". The CSV-import path already seeds levels (see
 * `product-imports/complete`); these hooks close the same gap for hand-created
 * products.
 *
 * We hook both `productsCreated` (product created with inline variants — the
 * common Admin path) and `productVariantsCreated` (variant added to an existing
 * product). The backfill is create-if-missing/idempotent, so the overlap when
 * both fire for one creation is harmless; covering both guarantees no path is
 * missed. Hooks run inside the seller's request, so the tenant context (and the
 * RLS read patch) is active — a plain event subscriber would run out of context
 * and RLS would fail closed. Failures are logged, never thrown, so inventory
 * backfill can't roll back product creation.
 */
async function backfill(
  variantIds: string[],
  container: { resolve: (key: string) => unknown }
): Promise<void> {
  const tenant = getTenantContext()
  if (!tenant?.tenantId || variantIds.length === 0) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info: (m: string) => void
    error: (m: string) => void
  }
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as Knex

  try {
    const created = await ensureVariantInventoryLevels(knex, {
      tenantId: tenant.tenantId,
      variantIds,
      stockedQuantity: DEFAULT_STOCKED_QUANTITY,
    })
    if (created > 0) {
      logger.info(
        `[selfkart] backfilled ${created} inventory level(s) for ${variantIds.length} new variant(s) (tenant=${tenant.tenantId})`
      )
    }
  } catch (e) {
    logger.error(
      `[selfkart] inventory level backfill failed (tenant=${tenant.tenantId}): ${
        (e as Error).message
      }`
    )
  }
}

const toIds = (rows: Array<{ id?: string } | undefined> | undefined): string[] =>
  (rows ?? [])
    .map((r) => r?.id)
    .filter((id): id is string => typeof id === "string")

createProductsWorkflow.hooks.productsCreated(
  async (
    { products }: { products?: Array<{ variants?: Array<{ id?: string }> }> },
    { container }
  ) => {
    const variantIds = (products ?? []).flatMap((p) => toIds(p?.variants))
    await backfill(variantIds, container)
  }
)

createProductVariantsWorkflow.hooks.productVariantsCreated(
  async (
    { product_variants }: { product_variants?: Array<{ id?: string }> },
    { container }
  ) => {
    await backfill(toIds(product_variants), container)
  }
)
