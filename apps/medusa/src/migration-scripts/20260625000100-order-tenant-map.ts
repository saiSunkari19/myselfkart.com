import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Non-RLS bridge mapping `order_id -> tenant_id`.
 *
 * `order.placed` subscribers and the Shiprocket status webhook (SH-4) run OUT of
 * tenant context, and `order` is RLS-forced, so they can't read the order to find
 * its tenant. This platform table (same posture as tenants/tenant_domains) is
 * populated by an AFTER INSERT trigger on `order` (tenant_id is already stamped by
 * the existing BEFORE INSERT tenant trigger), and is readable with no context.
 * Existing orders are backfilled once here.
 */
export default async function createOrderTenantMap({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Creating order_tenant_map bridge + trigger")

  await knex.raw(`
    create table if not exists "order_tenant_map" (
      "order_id"   text        primary key,
      "tenant_id"  uuid        not null,
      "created_at" timestamptz not null default now()
    );
  `)

  await knex.raw(`grant select, insert, update, delete on "order_tenant_map" to medusa_app;`)

  await knex.raw(`
    create or replace function selfkart_map_order_tenant() returns trigger as $$
    begin
      if NEW.tenant_id is not null then
        insert into "order_tenant_map" ("order_id", "tenant_id")
        values (NEW.id, NEW.tenant_id)
        on conflict ("order_id") do nothing;
      end if;
      return NEW;
    exception when others then
      -- Never let mapping break order creation.
      return NEW;
    end;
    $$ language plpgsql security definer;
  `)

  await knex.raw(`drop trigger if exists selfkart_map_order_tenant_trg on "order";`)
  await knex.raw(`
    create trigger selfkart_map_order_tenant_trg
      after insert on "order"
      for each row execute function selfkart_map_order_tenant();
  `)

  // Backfill existing orders (this script runs as the migrator/owner, which
  // bypasses RLS, so it can see every tenant's orders).
  const res = await knex.raw(`
    insert into "order_tenant_map" ("order_id", "tenant_id")
    select "id", "tenant_id" from "order" where "tenant_id" is not null
    on conflict ("order_id") do nothing;
  `)

  logger.info(`order_tenant_map ready (backfilled existing orders)`)
  void res
}
