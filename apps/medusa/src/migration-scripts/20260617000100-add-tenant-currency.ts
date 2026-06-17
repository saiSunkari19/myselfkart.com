import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Adds the tenant's market to the `tenants` registry: `currency` (ISO 4217,
 * lowercase, e.g. "inr") and `country` (primary ISO-3166-1 alpha-2, e.g. "in").
 *
 * Why this is needed: regions are PLATFORM-shared (one per currency). With more
 * than one market live (INR / USD / AED / EUR), the storefront can no longer
 * guess "the first region with countries" — it must resolve the region that
 * matches THIS tenant's currency. The domain resolver returns `currency` from
 * here so `getRegion` can pick deterministically. Nullable so existing tenants
 * keep working until backfilled by re-provisioning.
 *
 * Idempotent (add column if not exists). `tenants` is a platform table owned by
 * the migrator role, so this runs under the migrator/owner DATABASE_URL.
 */
export default async function addTenantCurrency({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Adding tenants.currency / tenants.country")

  await knex.raw(`alter table if exists "tenants" add column if not exists "currency" text;`)
  await knex.raw(`alter table if exists "tenants" add column if not exists "country" text;`)

  logger.info("tenants.currency / tenants.country ready")
}
