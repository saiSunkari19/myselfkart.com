import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import knexLib from "knex"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
  destroy?: () => Promise<void>
}

/**
 * Expands store_config with all customization columns needed for the guided
 * setup + advanced tabs in Store Design.
 *
 * Uses ADD COLUMN IF NOT EXISTS throughout — safe to re-run, never drops or
 * modifies existing columns, no other table is touched.
 *
 * Must connect via MIGRATOR_DATABASE_URL (superuser / table owner) because
 * ALTER TABLE requires ownership — medusa_app only has DML rights.
 */
export default async function expandStoreConfig({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // Use the superuser connection for DDL — same as the original migration.
  const migratorUrl = process.env.MIGRATOR_DATABASE_URL?.replace(/^"|"$/g, "")
  if (!migratorUrl) {
    throw new Error("MIGRATOR_DATABASE_URL env var is not set")
  }

  const knex = knexLib({ client: "pg", connection: migratorUrl }) as unknown as KnexLike

  try {
    logger.info("Expanding store_config table")

    // ── Branding ──────────────────────────────────────────────────────────────
    await knex.raw(`alter table "store_config" add column if not exists "favicon_url" text`)

    // ── Homepage ──────────────────────────────────────────────────────────────
    await knex.raw(`alter table "store_config" add column if not exists "announcement_enabled" boolean not null default true`)
    await knex.raw(`alter table "store_config" add column if not exists "announcement_text"    text`)
    await knex.raw(`alter table "store_config" add column if not exists "hero_cta"             jsonb`)
    await knex.raw(`alter table "store_config" add column if not exists "trust_badges"         jsonb`)

    // ── Policies ──────────────────────────────────────────────────────────────
    await knex.raw(`alter table "store_config" add column if not exists "return_policy"        text`)
    await knex.raw(`alter table "store_config" add column if not exists "shipping_policy"      text`)
    await knex.raw(`alter table "store_config" add column if not exists "privacy_policy"       text`)
    await knex.raw(`alter table "store_config" add column if not exists "terms_policy"         text`)

    // ── Contact ───────────────────────────────────────────────────────────────
    await knex.raw(`alter table "store_config" add column if not exists "about_text"           text`)
    await knex.raw(`alter table "store_config" add column if not exists "contact_email"        text`)
    await knex.raw(`alter table "store_config" add column if not exists "contact_phone"        text`)
    await knex.raw(`alter table "store_config" add column if not exists "whatsapp_number"      text`)
    await knex.raw(`alter table "store_config" add column if not exists "instagram_url"        text`)
    await knex.raw(`alter table "store_config" add column if not exists "youtube_url"          text`)
    await knex.raw(`alter table "store_config" add column if not exists "gst_number"           text`)
    await knex.raw(`alter table "store_config" add column if not exists "business_address"     text`)

    // ── SEO ───────────────────────────────────────────────────────────────────
    await knex.raw(`alter table "store_config" add column if not exists "seo_title"            text`)
    await knex.raw(`alter table "store_config" add column if not exists "seo_description"      text`)
    await knex.raw(`alter table "store_config" add column if not exists "seo_og_image_url"     text`)

    // ── Commerce / Settings ───────────────────────────────────────────────────
    await knex.raw(`alter table "store_config" add column if not exists "free_shipping_threshold" integer`)
    await knex.raw(`alter table "store_config" add column if not exists "cod_enabled"           boolean not null default false`)
    await knex.raw(`alter table "store_config" add column if not exists "whatsapp_notifications_enabled" boolean not null default false`)
    await knex.raw(`alter table "store_config" add column if not exists "custom_domain"         text`)
    await knex.raw(`alter table "store_config" add column if not exists "is_published"          boolean not null default false`)

    // ── Filters ───────────────────────────────────────────────────────────────
    await knex.raw(`alter table "store_config" add column if not exists "filter_config"         jsonb`)

    logger.info("store_config expansion complete")
  } finally {
    await (knex as any).destroy()
  }
}
