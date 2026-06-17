import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"
import { stableId, tenantSalesChannelId } from "./seed-tenant-inventory-resources"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Input = {
  tenantId: string
  host: string
  sellerName: string
  slug: string
  status: string
  /** Market currency (iso 4217, lowercase) — stamped on the tenant so the
   *  storefront resolves the matching region. Optional on the CLI path. */
  currency?: string
  /** Primary market country (iso 3166-1 alpha-2). */
  country?: string
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function readInput(): Input {
  const tenantId = process.env.TENANT_ID ?? process.env.SELLER_ADMIN_TENANT_ID ?? ""
  const host = (process.env.HOST ?? "").trim().toLowerCase()
  const sellerName = process.env.SELLER_NAME ?? "Selfkart Seller"
  const status = process.env.TENANT_STATUS ?? "active"

  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("TENANT_ID must be a valid UUID")
  }
  if (!host) {
    throw new Error("HOST is required (the storefront domain, e.g. seller-a.localhost)")
  }
  if (!["draft", "active", "suspended"].includes(status)) {
    throw new Error("TENANT_STATUS must be one of draft|active|suspended")
  }

  const slug = process.env.TENANT_SLUG ? slugify(process.env.TENANT_SLUG) : slugify(sellerName)
  const currency = process.env.SELFKART_CURRENCY?.trim().toLowerCase() || undefined
  const country = process.env.SELFKART_COUNTRY?.trim().toLowerCase() || undefined

  return { tenantId, host, sellerName, slug, status, currency, country }
}

/**
 * Finds the tenant's own sales channel. Runs inside tenant context so RLS only
 * exposes channels owned by this tenant (the platform Default channel is hidden
 * by the tenant-nullable policy).
 */
async function findTenantSalesChannelId(knex: Knex, tenantId: string): Promise<string> {
  return runWithTenantContext({ tenantId, source: "session" }, async () => {
    return knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])

      // Resolve the channel by its deterministic seeded id AND filter on
      // tenant_id explicitly (defense in depth with RLS). This makes it
      // impossible to link a publishable key to another tenant's sales channel —
      // the bug that previously crossed seller-a's key to seller-b's channel.
      const seededId = tenantSalesChannelId(tenantId)
      const seeded = await trx("sales_channel")
        .where({ id: seededId, tenant_id: tenantId })
        .whereNull("deleted_at")
        .first("id")
      if (seeded?.id) {
        return seeded.id as string
      }

      // Fallback: any channel explicitly owned by this tenant (still tenant-filtered).
      const row = await trx("sales_channel")
        .where({ tenant_id: tenantId })
        .whereNull("deleted_at")
        .orderBy("created_at", "asc")
        .first("id")
      if (!row?.id) {
        throw new Error(
          "No tenant sales channel found. Run seed-tenant-inventory-resources first."
        )
      }
      return row.id as string
    })
  })
}

/**
 * Ensures the publishable key is linked to EXACTLY the tenant's own sales channel:
 * soft-deletes any active link to a different channel (repairs the historical
 * cross-link) and inserts the correct link if missing. Runs every provision so
 * re-running heals already-crossed keys. publishable_api_key_sales_channel is not
 * tenant-RLS'd (api_key is platform-global), so this reads the true links
 * regardless of tenant context.
 */
async function ensureApiKeySalesChannelLink(
  knex: Knex,
  apiKeyId: string,
  salesChannelId: string
): Promise<number> {
  const repaired = await knex("publishable_api_key_sales_channel")
    .where({ publishable_key_id: apiKeyId })
    .whereNot({ sales_channel_id: salesChannelId })
    .whereNull("deleted_at")
    .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })

  const existing = await knex("publishable_api_key_sales_channel")
    .where({ publishable_key_id: apiKeyId, sales_channel_id: salesChannelId })
    .whereNull("deleted_at")
    .first("id")

  if (!existing) {
    await knex("publishable_api_key_sales_channel").insert({
      id: stableId("pksc_selfkart", apiKeyId, salesChannelId),
      publishable_key_id: apiKeyId,
      sales_channel_id: salesChannelId,
    })
  }

  return repaired
}

/**
 * Callable form used by the platform onboarding orchestrator (provision-seller).
 * The CLI default export below reads env into `input` and delegates here.
 */
export async function provisionTenantStorefrontWith(
  container: ExecArgs["container"],
  input: Input
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const apiKeyModule = container.resolve(Modules.API_KEY)

  // Upsert the tenant registry row first so tenant_domains FK is satisfiable.
  // currency/country are only written when provided, so a re-run without them
  // (CLI path missing the envs) never nulls out a previously-stamped market.
  const market: { currency?: string; country?: string } = {}
  if (input.currency) {
    market.currency = input.currency
  }
  if (input.country) {
    market.country = input.country
  }
  await knex("tenants")
    .insert({
      id: input.tenantId,
      name: input.sellerName,
      slug: input.slug,
      status: input.status,
      ...market,
      updated_at: knex.fn.now(),
    })
    .onConflict("id")
    .merge({
      name: input.sellerName,
      slug: input.slug,
      status: input.status,
      ...market,
      updated_at: knex.fn.now(),
    })

  // Resolve the tenant's OWN sales channel up front (deterministic + tenant-filtered).
  const salesChannelId = await findTenantSalesChannelId(knex, input.tenantId)

  // Reuse the publishable key already recorded for this host, if any.
  const existingDomain = await knex("tenant_domains")
    .whereRaw("lower(host) = ?", [input.host])
    .first("id", "publishable_key")

  let publishableKey = existingDomain?.publishable_key as string | undefined
  let apiKeyId: string

  if (!publishableKey) {
    // Create the key INSIDE the tenant context so the api_key RLS trigger stamps
    // tenant_id = this tenant (see migration 20260616000500). Without this, the
    // key would be stamped null (platform row) and the tenant-scoped /store*
    // publishable-key lookup — which runs under the domain's tenant context —
    // would not see it, breaking the storefront.
    const apiKey = await runWithTenantContext(
      { tenantId: input.tenantId, source: "session" },
      () =>
        apiKeyModule.createApiKeys({
          title: `${input.sellerName} Storefront Key`,
          type: "publishable",
          created_by: "selfkart-storefront-provision",
        })
    )
    apiKeyId = apiKey.id
    publishableKey = apiKey.token
    logger.info(`Created publishable key ${apiKey.redacted}`)
  } else {
    // Re-provision / repair path: resolve the existing key's id from its token.
    const existingKey = await knex("api_key")
      .where({ token: publishableKey })
      .whereNull("deleted_at")
      .first("id")
    if (!existingKey?.id) {
      throw new Error(
        `tenant_domains has publishable_key for ${input.host} but no matching api_key row`
      )
    }
    apiKeyId = existingKey.id
  }

  // Always (re)assert the link so the key points at this tenant's channel and
  // never another tenant's — repairs cross-linked keys on re-run.
  const repaired = await ensureApiKeySalesChannelLink(knex, apiKeyId, salesChannelId)
  if (repaired > 0) {
    logger.warn(
      `Repaired ${repaired} cross-linked sales-channel link(s) for ${input.host}; ` +
        `key now linked to tenant sales channel ${salesChannelId}`
    )
  } else {
    logger.info(`Publishable key linked to tenant sales channel ${salesChannelId}`)
  }

  const domainId = existingDomain?.id ?? `tdom_${slugify(input.host)}`
  await knex("tenant_domains")
    .insert({
      id: domainId,
      tenant_id: input.tenantId,
      host: input.host,
      publishable_key: publishableKey,
      is_primary: true,
      updated_at: knex.fn.now(),
    })
    .onConflict("id")
    .merge({
      tenant_id: input.tenantId,
      host: input.host,
      publishable_key: publishableKey,
      updated_at: knex.fn.now(),
    })

  logger.info(
    `Storefront provisioned: host=${input.host} tenant_id=${input.tenantId} status=${input.status}`
  )
}

export default async function provisionTenantStorefront({
  container,
}: ExecArgs): Promise<void> {
  await provisionTenantStorefrontWith(container, readInput())
}
