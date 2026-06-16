import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  addNullableDirectTenantResourceSql,
  quoteIdent,
} from "../modules/tenant-context/tenant-resource-sql"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

async function tableExists(knex: KnexLike, table: string): Promise<boolean> {
  const result = await knex.raw(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
        and table_name = ?
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

export default async function protectNotifications({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!(await tableExists(knex, "notification"))) {
    logger.warn("Skipping missing notification table")
    return
  }

  logger.info("Applying Selfkart tenant RLS to notification table")

  await applySql(knex, addNullableDirectTenantResourceSql("notification"))
  await knex.raw(`drop index if exists "IDX_notification_idempotency_key_unique";`)
  await knex.raw(`
    create unique index if not exists "IDX_notification_tenant_idempotency_key_unique"
    on "notification" (coalesce("tenant_id", '00000000-0000-0000-0000-000000000000'::uuid), "idempotency_key")
    where deleted_at is null and idempotency_key is not null;
  `)
  await knex.raw(`
    create index if not exists ${quoteIdent("IDX_notification_tenant_created_at")}
    on "notification" ("tenant_id", "created_at")
    where deleted_at is null;
  `)
  await knex.raw(`grant usage on schema public to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on all tables in schema public to medusa_app;`)
  await knex.raw(`grant usage, select on all sequences in schema public to medusa_app;`)

  logger.info("Selfkart tenant RLS applied to notification table")
}
