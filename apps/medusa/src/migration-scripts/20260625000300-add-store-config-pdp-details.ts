import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import knexLib from "knex"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
  destroy?: () => Promise<void>
}

/**
 * Adds the three product-detail-page trust lines (shipping / returns /
 * delivery) shown under Add to Cart — previously hardcoded per template,
 * now editable from the new "Product" tab in Store Design.
 *
 * Uses ADD COLUMN IF NOT EXISTS — safe to re-run, never drops or modifies
 * existing columns, no other table is touched.
 *
 * Must connect via MIGRATOR_DATABASE_URL (superuser / table owner) because
 * ALTER TABLE requires ownership — medusa_app only has DML rights.
 */
export default async function addStoreConfigPdpDetails({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const migratorUrl = process.env.MIGRATOR_DATABASE_URL?.replace(/^"|"$/g, "")
  if (!migratorUrl) {
    throw new Error("MIGRATOR_DATABASE_URL env var is not set")
  }

  const knex = knexLib({ client: "pg", connection: migratorUrl }) as unknown as KnexLike

  try {
    logger.info("Adding store_config PDP detail columns")
    await knex.raw(`alter table "store_config" add column if not exists "pdp_shipping_text" text`)
    await knex.raw(`alter table "store_config" add column if not exists "pdp_returns_text"  text`)
    await knex.raw(`alter table "store_config" add column if not exists "pdp_delivery_text" text`)
    logger.info("store_config PDP detail columns added")
  } finally {
    await (knex as any).destroy()
  }
}
