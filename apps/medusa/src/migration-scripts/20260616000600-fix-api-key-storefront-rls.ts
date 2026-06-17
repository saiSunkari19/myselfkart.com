import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { addPlatformReadableDirectTenantResourceSql } from "../modules/tenant-context/tenant-resource-sql"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

async function tableExists(knex: KnexLike, table: string): Promise<boolean> {
  const result = await knex.raw(
    `
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = ?
      ) as exists
    `,
    [table]
  )
  return Boolean(result.rows?.[0]?.exists)
}

async function applySql(knex: KnexLike, statements: string[]) {
  for (const statement of statements) {
    await knex.raw(statement)
  }
}

/**
 * Fixes the storefront regression introduced by 20260616000500-protect-api-key.
 *
 * That migration applied the NULLABLE-direct RLS policy to `api_key`, which
 * hides a tenant-stamped row whenever there is no `app.current_tenant`. But
 * Medusa's framework runs `ensurePublishableApiKeyMiddleware` on every `/store*`
 * request to validate the publishable key — and it runs BEFORE our
 * `domainTenantContextMiddleware`, so its `api_key` lookup carries no tenant
 * context. The tenant's key was therefore invisible and the storefront failed
 * with "A valid publishable key is required to proceed with the request".
 *
 * The corrected policy lets no-context (platform/system) reads see every row,
 * while a tenant context still isolates a seller to their own keys. The
 * framework lookup always filters by the exact token, and the admin key-listing
 * surface always runs WITH a tenant context, so seller-to-seller isolation is
 * preserved. Idempotent: it drops + recreates the policies, so it heals the
 * already-applied nullable policy in place.
 */
export default async function fixApiKeyStorefrontRls({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!(await tableExists(knex, "api_key"))) {
    logger.warn("api_key table not found; skipping api_key RLS fix")
    return
  }

  logger.info("Re-applying api_key RLS with platform-readable SELECT policy")
  await applySql(knex, addPlatformReadableDirectTenantResourceSql("api_key"))

  // Re-grant runtime privileges (medusa_app never owns tables).
  await knex.raw(`grant usage on schema public to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
  await knex.raw(`grant usage, select on all sequences in schema public to medusa_app;`)

  logger.info("api_key RLS fixed: storefront publishable-key lookup can resolve tenant keys again")
}
