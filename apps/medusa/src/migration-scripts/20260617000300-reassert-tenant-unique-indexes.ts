import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Medusa module migrations can recreate upstream global unique indexes after a
 * Selfkart migration script has already been marked executed. Reassert the
 * tenant-aware uniqueness needed by RLS provisioning after those module
 * migrations complete.
 */
export default async function reassertTenantUniqueIndexes({
  container,
}: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Reasserting Selfkart tenant-aware unique indexes")

  await knex.raw(`drop index if exists "IDX_fulfillment_set_name_unique";`)
  await knex.raw(`
    create unique index if not exists "IDX_fulfillment_set_tenant_name_unique"
    on "fulfillment_set" ("tenant_id", "name")
    where "deleted_at" is null;
  `)

  await knex.raw(`drop index if exists "IDX_service_zone_name_unique";`)
  await knex.raw(`
    create unique index if not exists "IDX_service_zone_tenant_name_unique"
    on "service_zone" ("tenant_id", "name")
    where "deleted_at" is null;
  `)

  logger.info("Selfkart tenant-aware unique indexes reasserted")
}
