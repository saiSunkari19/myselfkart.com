import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { getStoreConfig } from "../../../../platform/repository"
import { requireTenantContext } from "../../../../modules/tenant-context"

/**
 * GET /store/selfkart/store-config
 *
 * Public storefront endpoint — returns the full display config for the current
 * tenant so templates can apply colours, fonts, store name, policies, etc.
 *
 * Strips internal-only fields (tenant_id, custom_domain, gst_number,
 * business_address, is_published) that the storefront has no use for.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { tenantId } = requireTenantContext()
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const config = await getStoreConfig(knex, tenantId)

  if (!config) {
    res.json({ config: null })
    return
  }

  // Strip fields that are internal or server-side only
  const {
    tenant_id: _tid,
    custom_domain: _cd,
    is_published: _ip,
    ...publicConfig
  } = config as any

  res.json({ config: publicConfig })
}
