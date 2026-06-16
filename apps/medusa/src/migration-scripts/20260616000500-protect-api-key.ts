import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { addNullableDirectTenantResourceSql } from "../modules/tenant-context/tenant-resource-sql"

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
 * Tenant-isolate the `api_key` table so a seller can no longer see another
 * seller's publishable (or secret) keys — closing the "MEDIUM: api_key is not
 * tenant-scoped" gap.
 *
 * Uses the NULLABLE-direct policy on purpose: Medusa creates a platform "Default
 * Publishable API Key" at boot with NO tenant context, and any admin secret keys
 * may also be platform-level. The nullable policy keeps those tenant_id-null rows
 * valid and visible only when there is no tenant context (platform), while every
 * per-tenant key is stamped + isolated.
 *
 * Why this is safe for the storefront: the /store* publishable-key lookup
 * (`maybeAttachPublishableKeyScopes`) runs INSIDE our domain tenant context, so
 * its `api_key` read carries app.current_tenant = the domain's tenant. The
 * tenant's key is stamped with that same tenant (provision-storefront now creates
 * it inside tenant context; older keys are backfilled below), so it stays visible.
 *
 * NOT scoped here: `publishable_api_key_sales_channel` (the key<->channel link).
 * Both of its endpoints are already tenant-owned and the token (the secret) lives
 * on api_key, which is now isolated. Scoping the link is a lower-priority
 * follow-up and would need a live storefront pub-key-scope integration check.
 */
export default async function protectApiKey({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!(await tableExists(knex, "api_key"))) {
    logger.warn("api_key table not found; skipping api_key RLS")
    return
  }

  logger.info("Applying Selfkart tenant RLS to api_key")
  await applySql(knex, addNullableDirectTenantResourceSql("api_key"))

  // Backfill: stamp existing per-tenant keys from the tenant_domains registry
  // (its publishable_key column holds the api_key token). Keys with no matching
  // domain row (the platform Default key, any platform secret keys) stay null =
  // platform rows. The stamping trigger makes tenant_id immutable after insert,
  // so disable it only for this owner-run backfill, then re-enable.
  await knex.raw(`
    alter table "api_key" disable trigger "trg_api_key_tenant_id";

    update "api_key" ak
    set tenant_id = td.tenant_id
    from "tenant_domains" td
    where td."publishable_key" = ak."token"
    and ak."tenant_id" is distinct from td.tenant_id;

    alter table "api_key" enable trigger "trg_api_key_tenant_id";
  `)

  // Re-grant runtime privileges (medusa_app never owns tables).
  await knex.raw(`grant usage on schema public to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
  await knex.raw(`grant usage, select on all sequences in schema public to medusa_app;`)

  logger.info("Selfkart tenant RLS applied to api_key (per-tenant keys isolated; platform keys null)")
}
