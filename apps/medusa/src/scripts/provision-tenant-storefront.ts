import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Input = {
  tenantId: string
  host: string
  sellerName: string
  slug: string
  status: string
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

  return { tenantId, host, sellerName, slug, status }
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
      const row = await trx("sales_channel")
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

export default async function provisionTenantStorefront({
  container,
}: ExecArgs): Promise<void> {
  const input = readInput()
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  // Upsert the tenant registry row first so tenant_domains FK is satisfiable.
  await knex("tenants")
    .insert({
      id: input.tenantId,
      name: input.sellerName,
      slug: input.slug,
      status: input.status,
      updated_at: knex.fn.now(),
    })
    .onConflict("id")
    .merge({
      name: input.sellerName,
      slug: input.slug,
      status: input.status,
      updated_at: knex.fn.now(),
    })

  // Reuse the publishable key already recorded for this host, if any.
  const existingDomain = await knex("tenant_domains")
    .whereRaw("lower(host) = ?", [input.host])
    .first("id", "publishable_key")

  let publishableKey = existingDomain?.publishable_key as string | undefined

  if (!publishableKey) {
    const salesChannelId = await findTenantSalesChannelId(knex, input.tenantId)

    const apiKey = await apiKeyModule.createApiKeys({
      title: `${input.sellerName} Storefront Key`,
      type: "publishable",
      created_by: "selfkart-storefront-provision",
    })

    await link.create({
      [Modules.API_KEY]: { publishable_key_id: apiKey.id },
      [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannelId },
    })

    publishableKey = apiKey.token
    logger.info(
      `Created publishable key ${apiKey.redacted} linked to sales channel ${salesChannelId}`
    )
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
