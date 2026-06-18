import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type KnexLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Adds `selling_on` to seller_applications — the channel a seller is coming from
 * ("instagram_whatsapp", "flipkart_amazon", "offline_retail", "other"). Captured
 * on the public apply form so operators know where a lead originates and can
 * filter the console list by it. Nullable so applications created before this
 * migration stay valid; the check constraint allows null.
 *
 * `seller_applications` is a platform table owned by the migrator role, so this
 * runs under the migrator/owner DATABASE_URL. Idempotent (add column if not
 * exists), matching the other platform migration scripts in this folder.
 */
export default async function addApplicationSellingOn({ container }: ExecArgs): Promise<void> {
  const knex = container.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Adding seller_applications.selling_on")

  await knex.raw(`
    alter table if exists "seller_applications"
    add column if not exists "selling_on" text
      check (
        "selling_on" is null
        or "selling_on" in ('instagram_whatsapp', 'flipkart_amazon', 'offline_retail', 'other')
      );
  `)

  logger.info("seller_applications.selling_on ready")
}
