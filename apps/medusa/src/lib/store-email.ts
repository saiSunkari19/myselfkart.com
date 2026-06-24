import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Logger, MedusaContainer } from "@medusajs/framework/types"
import type { Knex } from "knex"

import { buildStoreFrom, getSendingDomain } from "./store-sender"

export type StoreSender = {
  from: string
  replyTo?: string
  storeName: string
  host?: string
}

/**
 * Resolve a tenant's email sender identity from the platform tables
 * (`store_config` + `tenant_domains`), keyed by EXPLICIT tenant_id. Both are
 * non-RLS platform tables, so this is safe to call from a context-less subscriber
 * or webhook. The privacy guarantee is the caller's: pass the originating order's
 * tenant_id (and read tenant-scoped order data under that tenant's context).
 */
export async function resolveStoreSender(knex: Knex, tenantId: string): Promise<StoreSender> {
  if (!tenantId) {
    throw new Error("[store-email] tenantId is required")
  }

  const config = await knex("store_config")
    .where({ tenant_id: tenantId })
    .first<{ store_name: string | null; contact_email: string | null } | undefined>(
      "store_name",
      "contact_email"
    )

  const domainRow = await knex("tenant_domains")
    .where({ tenant_id: tenantId, is_primary: true })
    .first<{ host: string | null } | undefined>("host")

  const storeName = config?.store_name?.trim() || "Store"
  return {
    from: buildStoreFrom(storeName, tenantId, getSendingDomain()),
    replyTo: config?.contact_email?.trim() || undefined,
    storeName,
    host: domainRow?.host ?? undefined,
  }
}

export type SendStoreEmailInput = {
  tenantId: string
  to: string
  subject: string
  html?: string
  text?: string
  /** Logical template name (informational for Resend; used for logging/idempotency). */
  template?: string
  data?: Record<string, unknown>
  idempotencyKey?: string
}

/**
 * Send a buyer-facing email under the tenant's store identity through the
 * Notification Module (Resend owns the "email" channel). Fail-closed when
 * tenantId/recipient is missing. Packs `from` + `reply_to` so the Resend provider
 * sends under the store identity with the seller's contact as Reply-To.
 *
 * The caller is responsible for being in the correct tenant context when it builds
 * the order/email body — this helper only resolves identity and dispatches.
 */
export async function sendStoreEmail(
  container: MedusaContainer,
  input: SendStoreEmailInput
): Promise<void> {
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)

  if (!input.tenantId || !input.to) {
    logger.warn("[store-email] missing tenantId or recipient; skipping send")
    return
  }

  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const sender = await resolveStoreSender(knex, input.tenantId)

  let notificationService: any
  try {
    notificationService = container.resolve(Modules.NOTIFICATION)
  } catch {
    logger.warn(`[store-email] no notification provider configured; skipping send to ${input.to}`)
    return
  }

  const template = input.template ?? "store-email"
  await notificationService.createNotifications({
    to: input.to,
    channel: "email",
    template,
    // Top-level `from` and a mirror in `data.from` — the Resend provider reads
    // `notification.from || data.from`, so the store identity survives either way.
    from: sender.from,
    content: {
      subject: input.subject,
      ...(input.html ? { html: input.html } : {}),
      ...(input.text ? { text: input.text } : {}),
    },
    data: {
      ...(input.data ?? {}),
      from: sender.from,
      ...(sender.replyTo ? { reply_to: sender.replyTo } : {}),
      store_name: sender.storeName,
      ...(sender.host ? { host: sender.host } : {}),
    },
    ...(input.idempotencyKey ? { idempotency_key: input.idempotencyKey } : {}),
  })

  logger.info(`[store-email] sent "${template}" to ${input.to} as ${sender.from}`)
}
