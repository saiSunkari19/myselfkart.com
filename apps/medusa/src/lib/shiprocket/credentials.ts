import type { Knex } from "knex"

import {
  getTenantShiprocketCredentialSummary,
  getTenantShiprocketSecret,
} from "../../platform/repository"

/** Resolved, decrypted Shiprocket credentials for one tenant. */
export type ResolvedShiprocketCredentials = {
  tenantId: string
  apiEmail: string
  apiPassword: string
  pickupLocation: string | null
}

/** Is Shiprocket configured AND enabled for this tenant? (cheap readiness check) */
export async function isShiprocketEnabled(knex: Knex, tenantId: string): Promise<boolean> {
  const summary = await getTenantShiprocketCredentialSummary(knex, tenantId)
  return Boolean(summary?.ready)
}

/**
 * Loads + decrypts a tenant's Shiprocket credentials, asserting the integration
 * is enabled. Throws otherwise so callers fail closed rather than using the wrong
 * account. Reads the non-RLS `tenant_shiprocket_credentials` table by explicit
 * tenant id, so no tenant context is required on the connection.
 */
export async function resolveShiprocketCredentials(
  knex: Knex,
  tenantId: string
): Promise<ResolvedShiprocketCredentials> {
  const summary = await getTenantShiprocketCredentialSummary(knex, tenantId)
  if (!summary) {
    throw new Error("Shiprocket is not configured for this store")
  }
  if (!summary.ready) {
    throw new Error("Shiprocket is not enabled for this store")
  }
  const apiPassword = await getTenantShiprocketSecret(knex, tenantId, "api_password")
  if (!apiPassword) {
    throw new Error("Shiprocket credentials are incomplete for this store")
  }
  return {
    tenantId,
    apiEmail: summary.api_email,
    apiPassword,
    pickupLocation: summary.pickup_location,
  }
}

/** Per-tenant webhook secret (SH-1 hardening); null falls back to env in the handler. */
export async function resolveShiprocketWebhookSecret(
  knex: Knex,
  tenantId: string
): Promise<string | null> {
  return getTenantShiprocketSecret(knex, tenantId, "webhook_secret")
}
