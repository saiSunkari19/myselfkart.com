import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { getStoreConfig } from "../../../../platform/repository"
import { TEMPLATES } from "../../../../platform/templates"
import { requireTenantContext } from "../../../../modules/tenant-context"

/**
 * GET /admin/selfkart/store-config
 *
 * Returns the tenant's current store config (template + customization) alongside
 * the full list of available templates. The admin UI uses this on mount to decide
 * which view to show — template picker (template_id null) or customize form.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { tenantId } = requireTenantContext()
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const config = await getStoreConfig(knex, tenantId)

  const domainRow = await knex("tenant_domains")
    .where({ tenant_id: tenantId, is_primary: true })
    .first("host")

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const storefront_url = domainRow?.host
    ? `${protocol}://${domainRow.host}`
    : null

  res.json({
    config,
    templates: TEMPLATES,
    storefront_url,
  })
}
