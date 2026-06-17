import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { verifyStorefrontSignature } from "../../../modules/tenant-context"

type KnexLike = {
  raw: (
    sql: string,
    bindings?: unknown[]
  ) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Server-to-server domain resolver for the Next.js storefront.
 *
 * Lives OUTSIDE /store* on purpose: it is the route that HANDS OUT the
 * publishable key, so it cannot itself require one. It is guarded instead by an
 * HMAC signature over the host (x-selfkart-host-sig) using the shared
 * SELFKART_STOREFRONT_SECRET, so only the Next.js server can call it. It reads
 * the platform tenant_domains/tenants registry (no tenant context needed).
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const host =
    typeof req.query.host === "string" ? req.query.host.trim().toLowerCase() : ""
  const signature = req.headers["x-selfkart-host-sig"]

  if (!host || !verifyStorefrontSignature(host, signature)) {
    res.status(403).json({ message: "Forbidden" })
    return
  }

  const knex = req.scope.resolve<KnexLike>(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await knex.raw(
    `
      select t."id" as tenant_id, t."status", t."currency", d."publishable_key"
      from "tenant_domains" d
      join "tenants" t on t."id" = d."tenant_id"
      where lower(d."host") = ?
      limit 1
    `,
    [host]
  )

  const row = result.rows?.[0]
  if (!row) {
    res.status(404).json({ message: "Unknown domain" })
    return
  }

  res.json({
    tenant_id: row.tenant_id,
    status: row.status,
    // The tenant's market currency — lets the storefront pick the matching
    // shared region when several markets are live. May be null for older tenants
    // until they are re-provisioned.
    currency: row.currency ?? null,
    publishable_key: row.publishable_key,
  })
}
