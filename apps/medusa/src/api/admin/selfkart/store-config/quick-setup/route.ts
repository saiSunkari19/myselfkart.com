import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { getStoreConfig, updateStoreCustomization } from "../../../../../platform/repository"
import { requireTenantContext } from "../../../../../modules/tenant-context"
import { buildDefaultConfig } from "../../../../../platform/defaults"
import type { TemplateId } from "../../../../../platform/templates"

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { tenantId } = requireTenantContext()
    const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

    const existing = await getStoreConfig(knex, tenantId)

    if (!existing?.template_id) {
      res.status(400).json({ message: "Pick a template before running quick setup." })
      return
    }

    const body = req.body as {
      store_name?: string
      logo_url?: string
      primary_color?: string
    }

    const storeName = typeof body.store_name === "string" ? body.store_name.trim() : ""
    if (!storeName) {
      res.status(400).json({ message: "store_name is required." })
      return
    }

    const defaults = buildDefaultConfig(existing.template_id as TemplateId, storeName)

    const fields = {
      ...defaults,
      ...(body.logo_url ? { logo_url: body.logo_url } : {}),
      ...(body.primary_color ? { primary_color: body.primary_color } : {}),
    }

    const config = await updateStoreCustomization(knex, tenantId, fields)

    // Sync the display name shown in the Medusa admin sidebar
    try {
      const storeModule = req.scope.resolve<any>(Modules.STORE)
      const [store] = await storeModule.listStores({}, { take: 1 })
      if (store) {
        await storeModule.updateStores(store.id, { name: storeName })
      }
    } catch {
      // Non-fatal — store config was saved, sidebar name sync failed
    }

    res.json({ config })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save store setup."
    res.status(500).json({ message })
  }
}
