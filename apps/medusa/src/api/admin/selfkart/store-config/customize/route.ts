import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  getStoreConfig,
  updateStoreCustomization,
  type StoreCustomizationFields,
} from "../../../../../platform/repository"
import { requireTenantContext } from "../../../../../modules/tenant-context"

/**
 * PUT /admin/selfkart/store-config/customize
 *
 * Updates any subset of customization fields — never touches template_id.
 * Used by all advanced tabs (Branding, Theme, Homepage, Policies, Contact,
 * SEO, Commerce, Filters). Each tab sends only its own fields.
 *
 * All fields are optional; only the ones present in the body are updated.
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { tenantId } = requireTenantContext()
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const existing = await getStoreConfig(knex, tenantId)
  if (!existing?.template_id) {
    res.status(400).json({
      message: "A template must be selected before saving customization settings.",
    })
    return
  }

  const body = req.body as Record<string, unknown>
  const fields: StoreCustomizationFields = {}

  // Helper — picks a text field from body if present (null clears it)
  const str = (key: string) => {
    if (key in body) {
      (fields as Record<string, unknown>)[key] =
        typeof body[key] === "string" && (body[key] as string).trim() !== ""
          ? (body[key] as string).trim()
          : null
    }
  }

  // Helper — picks a boolean field
  const bool = (key: string) => {
    if (key in body) {
      (fields as Record<string, unknown>)[key] = Boolean(body[key])
    }
  }

  // Helper — picks a number field
  const num = (key: string) => {
    if (key in body) {
      const v = Number(body[key])
      ;(fields as Record<string, unknown>)[key] = isNaN(v) ? null : v
    }
  }

  // Helper — picks a jsonb field (must be object/array, not a string)
  const json = (key: string) => {
    if (key in body && body[key] !== null && typeof body[key] === "object") {
      (fields as Record<string, unknown>)[key] = body[key]
    } else if (key in body && body[key] === null) {
      (fields as Record<string, unknown>)[key] = null
    }
  }

  // ── Branding ────────────────────────────────────────────────────────────────
  str("store_name")
  str("logo_url")
  str("tagline")
  str("favicon_url")

  // ── Theme ────────────────────────────────────────────────────────────────────
  str("primary_color")
  str("secondary_color")
  str("accent_color")
  str("font_heading")
  str("font_body")
  if ("color_mode" in body) {
    const mode = body["color_mode"]
    if (mode !== "light" && mode !== "dark") {
      res.status(400).json({ message: "color_mode must be 'light' or 'dark'." })
      return
    }
    fields.color_mode = mode
  }

  // ── Homepage ─────────────────────────────────────────────────────────────────
  bool("announcement_enabled")
  str("announcement_text")
  str("hero_image_url")
  str("hero_heading")
  str("hero_subtext")
  json("hero_cta")
  json("trust_badges")

  // ── Policies ─────────────────────────────────────────────────────────────────
  str("return_policy")
  str("shipping_policy")
  str("privacy_policy")
  str("terms_policy")

  // ── Contact ──────────────────────────────────────────────────────────────────
  str("about_text")
  str("contact_email")
  str("contact_phone")
  str("whatsapp_number")
  str("instagram_url")
  str("youtube_url")
  str("gst_number")
  str("business_address")

  // ── SEO ──────────────────────────────────────────────────────────────────────
  str("seo_title")
  str("seo_description")
  str("seo_og_image_url")

  // ── Commerce / Settings ──────────────────────────────────────────────────────
  num("free_shipping_threshold")
  bool("cod_enabled")
  bool("whatsapp_notifications_enabled")
  str("custom_domain")
  bool("is_published")

  // ── Filters ──────────────────────────────────────────────────────────────────
  json("filter_config")

  const config = await updateStoreCustomization(knex, tenantId, fields)

  // Sync store name to Medusa admin sidebar when branding tab saves it
  if (fields.store_name) {
    try {
      const storeModule = req.scope.resolve<any>(Modules.STORE)
      const [store] = await storeModule.listStores({}, { take: 1 })
      if (store) {
        await storeModule.updateStores(store.id, { name: fields.store_name })
      }
    } catch {
      // Non-fatal
    }
  }

  res.json({ config })
}
