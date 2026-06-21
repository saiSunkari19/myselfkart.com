import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  generateJwtToken,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

import { requireTenantContext, runWithTenantContext } from "../../../../modules/tenant-context"

/**
 * The piece that makes Medusa's GLOBAL auth identity work with our PER-TENANT,
 * RLS-scoped customers.
 *
 * `auth_identity` / `provider_identity` are intentionally NOT tenant-scoped (login
 * resolves them by (provider, email) before any tenant is known). But `customer`
 * is strict tenant-RLS. So one Google/email identity must map to a SEPARATE
 * customer per store. Given a verified auth identity + the current tenant
 * (from the signed /store* headers), this:
 *   1. resolves the tenant's customer by email (RLS-scoped) — the source of truth,
 *   2. creates it inside the tenant context if absent (the trigger stamps tenant_id),
 *   3. caches the per-tenant customer id on the global identity's app_metadata,
 *   4. mints a customer JWT whose actor_id IS that tenant-scoped customer.
 *
 * Medusa's auth middleware reads actor_id straight from the verified token (no
 * app_metadata re-lookup), so the minted token + the request's signed tenant
 * headers line up and RLS sees exactly one customer. The same identity on another
 * store mints a different actor_id — full isolation, no auth-module fork.
 */

type ProviderIdentity = {
  provider: string
  entity_id: string
  user_metadata?: Record<string, unknown> | null
}

export type ResolvableAuthIdentity = {
  id: string
  app_metadata?: Record<string, any> | null
  provider_identities?: ProviderIdentity[] | null
}

/** Pull email + name from the verified auth identity (emailpass: entity_id is the email; google: user_metadata). */
export function extractIdentityProfile(authIdentity: ResolvableAuthIdentity, provider: string): {
  email: string | null
  firstName: string | null
  lastName: string | null
} {
  const pi = (authIdentity.provider_identities ?? []).find((p) => p.provider === provider)
    ?? (authIdentity.provider_identities ?? [])[0]
  const meta = (pi?.user_metadata ?? {}) as Record<string, unknown>
  const email =
    (typeof meta.email === "string" && meta.email) ||
    (pi?.entity_id && pi.entity_id.includes("@") ? pi.entity_id : null) ||
    (typeof (authIdentity.app_metadata as any)?.email === "string"
      ? ((authIdentity.app_metadata as any).email as string)
      : null)
  const firstName =
    (typeof meta.given_name === "string" && meta.given_name) ||
    (typeof meta.first_name === "string" && meta.first_name) ||
    (typeof meta.name === "string" ? (meta.name as string).split(" ")[0] : null) ||
    null
  const lastName =
    (typeof meta.family_name === "string" && meta.family_name) ||
    (typeof meta.last_name === "string" && meta.last_name) ||
    null
  return { email: email ? email.toLowerCase().trim() : null, firstName, lastName }
}

/** Resolve (or create) the tenant-scoped customer for a verified identity and mint its JWT. */
export async function resolveTenantCustomerToken(
  container: MedusaContainer,
  authIdentity: ResolvableAuthIdentity,
  provider: string
): Promise<string> {
  const { tenantId } = requireTenantContext()
  const authService: any = container.resolve(Modules.AUTH)
  const customerService: any = container.resolve(Modules.CUSTOMER)

  const { email, firstName, lastName } = extractIdentityProfile(authIdentity, provider)
  if (!email) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Could not determine an email for this account.")
  }

  // 1 + 2. Existing tenant customer (RLS-scoped) is the source of truth; create
  // inside the tenant context so the RLS trigger stamps tenant_id. Wrapped in an
  // explicit runWithTenantContext (belt-and-suspenders, like create-seller-admin)
  // in case any async boundary detaches the middleware's ALS run.
  const customerId = await runWithTenantContext({ tenantId, source: "domain" }, async () => {
    const existing = await customerService.listCustomers({ email }, { take: 1 })
    if (existing.length > 0) return existing[0].id
    const created = await customerService.createCustomers({
      email,
      first_name: firstName ?? "",
      last_name: lastName ?? "",
      has_account: true,
    })
    return Array.isArray(created) ? created[0].id : created.id
  })

  // 3. Cache the per-tenant customer id on the GLOBAL auth identity (non-RLS).
  // Never set the singular `customer_id` — that would trip setAuthAppMetadataStep
  // ("customer_id already exists") for any other tenant on the same identity.
  const existingMeta = authIdentity.app_metadata ?? {}
  const map: Record<string, string> = { ...(existingMeta.customer_id_by_tenant ?? {}) }
  if (map[tenantId] !== customerId) {
    map[tenantId] = customerId
    await authService.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: { ...existingMeta, customer_id_by_tenant: map },
    })
  }

  // 4. Mint the tenant-scoped customer token.
  const config: any = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { http } = config.projectConfig
  return generateJwtToken(
    {
      actor_id: customerId,
      actor_type: "customer",
      auth_identity_id: authIdentity.id,
      auth_provider: provider,
      app_metadata: { customer_id: customerId },
    },
    {
      secret: http.jwtSecret,
      expiresIn: http.jwtExpiresIn ?? "7d",
      jwtOptions: http.jwtOptions,
    }
  )
}
