import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Platform-operator (superadmin) tables for the Selfkart onboarding console.
 *
 * Like `tenants` / `tenant_domains` (see 20260616000200-create-tenant-registry),
 * these are PLATFORM tables, NOT tenant-scoped:
 *
 *   - `platform_admins`          operators of the superadmin console. They act
 *                                ACROSS all tenants, so they are deliberately
 *                                outside the per-tenant RLS model.
 *   - `platform_admin_sessions`  opaque bearer sessions for those operators.
 *   - `seller_applications`      the public "become a seller" funnel. A row is
 *                                created BEFORE any tenant exists (status
 *                                `pending`); an operator approves it, which runs
 *                                provisioning and back-fills `tenant_id`.
 *
 * They are owned by the migrator role (neondb_owner) and only granted DML to the
 * runtime role (medusa_app), which never owns them — same posture as the tenant
 * registry. No RLS: there is no tenant to scope by, and access is gated entirely
 * at the application layer (the platform auth middleware + a separate console).
 */
export default async function createPlatformAdmin({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Creating Selfkart platform-admin tables (platform_admins, sessions, seller_applications)")

  await knex.raw(`
    create table if not exists "platform_admins" (
      "id" text primary key,
      "email" text not null,
      "name" text not null,
      "password_hash" text not null,
      "role" text not null default 'operator'
        check ("role" in ('owner', 'operator')),
      "disabled_at" timestamptz,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now()
    );
  `)
  await knex.raw(`
    create unique index if not exists "IDX_platform_admins_email_unique"
    on "platform_admins" (lower("email"));
  `)

  await knex.raw(`
    create table if not exists "platform_admin_sessions" (
      "id" text primary key,
      "admin_id" text not null references "platform_admins" ("id") on delete cascade,
      "token_hash" text not null,
      "expires_at" timestamptz not null,
      "created_at" timestamptz not null default now()
    );
  `)
  await knex.raw(`
    create unique index if not exists "IDX_platform_admin_sessions_token_hash"
    on "platform_admin_sessions" ("token_hash");
  `)
  await knex.raw(`
    create index if not exists "IDX_platform_admin_sessions_admin_id"
    on "platform_admin_sessions" ("admin_id");
  `)

  await knex.raw(`
    create table if not exists "seller_applications" (
      "id" text primary key,
      "store_name" text not null,
      "owner_name" text not null,
      "owner_email" text not null,
      "desired_subdomain" text not null,
      "country" text not null default 'us',
      "currency" text not null default 'usd',
      "phone" text,
      "notes" text,
      "status" text not null default 'pending'
        check ("status" in ('pending', 'approved', 'provisioning', 'active', 'rejected', 'failed')),
      "tenant_id" uuid references "tenants" ("id"),
      "host" text,
      "provisioning_error" text,
      "reviewed_by" text references "platform_admins" ("id"),
      "reviewed_at" timestamptz,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now()
    );
  `)
  await knex.raw(`
    create index if not exists "IDX_seller_applications_status"
    on "seller_applications" ("status");
  `)
  await knex.raw(`
    create index if not exists "IDX_seller_applications_created_at"
    on "seller_applications" ("created_at" desc);
  `)
  // One pending/active application per desired subdomain so two sellers cannot
  // race for the same host. Rejected/failed rows are allowed to repeat.
  await knex.raw(`
    create unique index if not exists "IDX_seller_applications_subdomain_live"
    on "seller_applications" (lower("desired_subdomain"))
    where "status" in ('pending', 'approved', 'provisioning', 'active');
  `)

  await knex.raw(`grant select, insert, update, delete on "platform_admins" to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on "platform_admin_sessions" to medusa_app;`)
  await knex.raw(`grant select, insert, update, delete on "seller_applications" to medusa_app;`)

  logger.info("Selfkart platform-admin tables ready")
}
