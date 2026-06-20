import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  setTemplateId,
  TemplateAlreadySetError,
} from "../../../../../platform/repository"
import { TEMPLATE_IDS } from "../../../../../platform/templates"
import { requireTenantContext } from "../../../../../modules/tenant-context"

/**
 * POST /admin/selfkart/store-config/template
 *
 * Locks in the seller's template choice. One-time only — returns 409 if a
 * template is already set. Validates the template_id against the hardcoded list
 * so sellers can't inject arbitrary values.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { tenantId } = requireTenantContext()
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const { template_id } = req.body as { template_id?: string }

  if (!template_id || !TEMPLATE_IDS.has(template_id)) {
    res.status(400).json({
      message: `Invalid template. Valid options: ${[...TEMPLATE_IDS].join(", ")}`,
    })
    return
  }

  try {
    const config = await setTemplateId(knex, tenantId, template_id)
    res.json({ config })
  } catch (err) {
    if (err instanceof TemplateAlreadySetError) {
      res.status(409).json({ message: err.message })
      return
    }
    throw err
  }
}
