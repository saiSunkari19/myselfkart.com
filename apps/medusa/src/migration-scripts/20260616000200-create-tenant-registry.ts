import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Creates the minimal Selfkart tenant registry used by the storefront domain
 * resolver (Phase 1 / seed of Phase 2).
 *
 * `tenants` and `tenant_domains` are PLATFORM tables, NOT tenant-scoped: they are
 * the source of truth that maps an incoming storefront host -> tenant_id, and
 * they are read BEFORE any tenant context exists. They are therefore deliberately
 * left without RLS. They are owned by the migrator role (neondb_owner) and only
 * granted DML to medusa_app, so the runtime role never owns them.
 *
 * Each tenant_domains row also carries the tenant's publishable_key so the
 * Next.js server can attach `x-publishable-api-key` (Medusa store routes require
 * it and use it for sales-channel scoping) alongside the signed tenant header.
 */
export default async function createTenantRegistry({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Creating Selfkart tenant registry (tenants, tenant_domains)")

  await knex.raw(`
    create table if not exists "tenants" (
      "id" uuid primary key,
      "name" text not null,
      "slug" text not null,
      "status" text not null default 'active'
        check ("status" in ('draft', 'active', 'suspended')),
      "plan" text,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now()
    );
  `)
  await knex.raw(`
    create unique index if not exists "IDX_tenants_slug_unique" on "tenants" ("slug");
  `)

  await knex.raw(`
    create table if not exists "tenant_domains" (
      "id" text primary key,
      "tenant_id" uuid not null references "tenants" ("id"),
      "host" text not null,
      "publishable_key" text,
      "is_primary" boolean not null default false,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now()
    );
  `)
  await knex.raw(`
    create unique index if not exists "IDX_tenant_domains_host_unique"
    on "tenant_domains" (lower("host"));
  `)
  await knex.raw(`
    create index if not exists "IDX_tenant_domains_tenant_id"
    on "tenant_domains" ("tenant_id");
  `)

  // Platform registry tables: runtime role reads/writes but never owns them.
  await knex.raw(`grant select, insert, update, delete on "tenants" to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on "tenant_domains" to medusa_app;`)

  logger.info("Selfkart tenant registry ready")
}
