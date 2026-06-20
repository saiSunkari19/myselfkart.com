import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Creates store_config — one row per tenant, written by the seller via their
 * admin panel and read by the storefront at render time.
 *
 * template_id is NULL until the seller picks a template (one-time, permanent).
 * All customization columns are NULL until the seller explicitly saves them.
 *
 * No FK to tenants: consistent with tenant_payment_credentials — we don't want
 * hard FK coupling across platform and tenant-scoped tables.
 */
export default async function addStoreConfig({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Creating store_config table")

  await knex.raw(`
    create table if not exists "store_config" (
      "tenant_id"        uuid        primary key,
      "template_id"      text,
      "logo_url"         text,
      "store_name"       text,
      "tagline"          text,
      "primary_color"    text,
      "secondary_color"  text,
      "accent_color"     text,
      "color_mode"       text        not null default 'light'
                                     check ("color_mode" in ('light', 'dark')),
      "font_heading"     text,
      "font_body"        text,
      "hero_image_url"   text,
      "hero_heading"     text,
      "hero_subtext"     text,
      "created_at"       timestamptz not null default now(),
      "updated_at"       timestamptz not null default now()
    );
  `)

  await knex.raw(`grant select, insert, update, delete on "store_config" to medusa_app;`)

  logger.info("store_config table ready")
}
