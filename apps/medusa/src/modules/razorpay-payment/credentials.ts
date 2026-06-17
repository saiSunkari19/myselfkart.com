import knexFactory, { type Knex } from "knex"

import {
  getTenantPaymentCredentialSecret,
  getTenantPaymentCredentialSummary,
} from "../../platform/repository"
import { getTenantContext } from "../tenant-context"

/**
 * Resolved, decrypted Razorpay credentials for one tenant — built per payment
 * operation from `tenant_payment_credentials`. Never cached across tenants.
 */
export type ResolvedRazorpayCredentials = {
  tenantId: string
  mode: "test" | "live"
  keyId: string
  keySecret: string
  webhookSecret: string
}

/**
 * `tenant_payment_credentials` is a non-RLS platform table, so we read it on a
 * plain pooled connection (no tenant context needed on the connection itself —
 * the tenant id is passed explicitly). The payment module is isolated and may
 * not expose Medusa's shared PG_CONNECTION, so we keep a small dedicated pool.
 */
let sharedKnex: Knex | undefined

function getKnex(): Knex {
  if (!sharedKnex) {
    const connection =
      process.env.DATABASE_URL || process.env.APP_DATABASE_URL
    if (!connection) {
      throw new Error("DATABASE_URL is required to read payment credentials")
    }
    sharedKnex = knexFactory({
      client: "pg",
      connection,
      pool: { min: 0, max: 2 },
    })
  }
  return sharedKnex
}

/** The tenant id for the current request, or throws if there is no context. */
export function requireTenantId(): string {
  const ctx = getTenantContext()
  if (!ctx?.tenantId) {
    throw new Error(
      "Razorpay payment requires tenant context — none was set for this request"
    )
  }
  return ctx.tenantId
}

/**
 * Loads and decrypts a tenant's Razorpay credentials, asserting the integration
 * is enabled and fully configured. Throws a clear error otherwise so checkout
 * fails closed rather than silently using the wrong account.
 */
export async function resolveRazorpayCredentials(
  tenantId: string
): Promise<ResolvedRazorpayCredentials> {
  const knex = getKnex()
  const summary = await getTenantPaymentCredentialSummary(
    knex,
    tenantId,
    "razorpay"
  )

  if (!summary) {
    throw new Error("Razorpay is not configured for this store")
  }
  if (!summary.enabled || !summary.ready) {
    throw new Error("Razorpay is not enabled for this store")
  }

  const [keySecret, webhookSecret] = await Promise.all([
    getTenantPaymentCredentialSecret(knex, tenantId, "razorpay", "key_secret"),
    getTenantPaymentCredentialSecret(
      knex,
      tenantId,
      "razorpay",
      "webhook_secret"
    ),
  ])

  if (!keySecret || !webhookSecret) {
    throw new Error("Razorpay credentials are incomplete for this store")
  }

  return {
    tenantId,
    mode: summary.mode,
    keyId: summary.key_id,
    keySecret,
    webhookSecret,
  }
}

/**
 * Resolves a tenant's webhook secret by tenant id alone (no request context).
 * Used by the webhook handler, which runs outside any tenant request.
 */
export async function resolveWebhookSecret(
  tenantId: string
): Promise<string | null> {
  return getTenantPaymentCredentialSecret(
    getKnex(),
    tenantId,
    "razorpay",
    "webhook_secret"
  )
}
