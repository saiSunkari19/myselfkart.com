import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Stores per-tenant payment-provider credentials controlled by the platform
 * operator. Secrets are encrypted by the app before insert/update; this table is
 * deliberately platform-managed and not exposed through tenant admin APIs.
 */
export default async function createTenantPaymentCredentials({
  container,
}: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Creating tenant payment credentials table")

  await knex.raw(`
    create table if not exists "tenant_payment_credentials" (
      "tenant_id" uuid not null references "tenants" ("id") on delete cascade,
      "provider" text not null,
      "mode" text not null default 'test'
        check ("mode" in ('test', 'live')),
      "enabled" boolean not null default false,
      "key_id" text not null,
      "key_secret_encrypted" text not null,
      "key_secret_hint" text not null,
      "webhook_secret_encrypted" text not null,
      "webhook_secret_hint" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      primary key ("tenant_id", "provider"),
      check ("provider" in ('razorpay'))
    );
  `)
  await knex.raw(`
    create index if not exists "IDX_tenant_payment_credentials_provider"
    on "tenant_payment_credentials" ("provider");
  `)
  await knex.raw(`
    grant select, insert, update, delete on "tenant_payment_credentials" to medusa_app;
  `)

  logger.info("Tenant payment credentials table ready")
}
