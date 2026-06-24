import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * SH-1 / SH-3 storage:
 *  - tenant_shiprocket_credentials: per-tenant Shiprocket API user (email +
 *    encrypted password) + optional per-tenant webhook secret + default pickup
 *    location. Platform-managed (set by the operator), never exposed to tenant
 *    admin. Same posture/encryption as tenant_payment_credentials.
 *  - order_shiprocket: non-RLS bridge recording which orders were pushed to
 *    Shiprocket (idempotency for the push subscriber) + the returned ids/AWB.
 */
export default async function createShiprocketTables({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Creating tenant_shiprocket_credentials + order_shiprocket tables")

  await knex.raw(`
    create table if not exists "tenant_shiprocket_credentials" (
      "tenant_id"                uuid        primary key references "tenants" ("id") on delete cascade,
      "enabled"                  boolean     not null default false,
      "api_email"                text        not null,
      "api_password_encrypted"   text        not null,
      "api_password_hint"        text        not null,
      "webhook_secret_encrypted" text,
      "webhook_secret_hint"      text,
      "pickup_location"          text,
      "created_at"               timestamptz not null default now(),
      "updated_at"               timestamptz not null default now()
    );
  `)
  await knex.raw(
    `grant select, insert, update, delete on "tenant_shiprocket_credentials" to medusa_app;`
  )

  await knex.raw(`
    create table if not exists "order_shiprocket" (
      "order_id"            text        primary key,
      "tenant_id"           uuid        not null,
      "shiprocket_order_id" text,
      "shipment_id"         text,
      "awb"                 text,
      "status"              text,
      "created_at"          timestamptz not null default now(),
      "updated_at"          timestamptz not null default now()
    );
  `)
  await knex.raw(`grant select, insert, update, delete on "order_shiprocket" to medusa_app;`)

  logger.info("Shiprocket tables ready")
}
