import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import knexLib from "knex"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
  destroy?: () => Promise<void>
}

/**
 * Adds store_config.sections — a jsonb map of per-template homepage section
 * content (e.g. testimonials, trust strip, editorial banner) keyed by
 * section id. Shape/limits for each section are validated in application
 * code against the template's schema in platform/templates.ts, not in the
 * database.
 *
 * Uses ADD COLUMN IF NOT EXISTS — safe to re-run, never drops or modifies
 * existing columns, no other table is touched.
 *
 * Must connect via MIGRATOR_DATABASE_URL (superuser / table owner) because
 * ALTER TABLE requires ownership — medusa_app only has DML rights.
 */
export default async function addStoreConfigSections({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const migratorUrl = process.env.MIGRATOR_DATABASE_URL?.replace(/^"|"$/g, "")
  if (!migratorUrl) {
    throw new Error("MIGRATOR_DATABASE_URL env var is not set")
  }

  const knex = knexLib({ client: "pg", connection: migratorUrl }) as unknown as KnexLike

  try {
    logger.info("Adding store_config.sections")
    await knex.raw(`alter table "store_config" add column if not exists "sections" jsonb`)
    logger.info("store_config.sections added")
  } finally {
    await (knex as any).destroy()
  }
}
