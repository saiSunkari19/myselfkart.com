import "server-only"

import { getTenantMedusa } from "./medusa/client"
import type { TenantResolution } from "./tenant/types"

// ---------------------------------------------------------------------------
// Types (mirrored from medusa platform — storefront can't import server code)
// ---------------------------------------------------------------------------

export type HeroCta = {
  primary_label: string
  primary_link: string
  secondary_label?: string
  secondary_link?: string
}

export type TrustBadge = {
  icon: string
  title: string
  description: string
}

export type FilterConfig = {
  enabled: string[]
  order: string[]
  labels: Record<string, string>
}

export type StoreConfig = {
  template_id: string | null
  // Branding
  logo_url: string | null
  store_name: string | null
  tagline: string | null
  favicon_url: string | null
  // Theme
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  color_mode: "light" | "dark"
  font_heading: string | null
  font_body: string | null
  // Homepage
  announcement_enabled: boolean
  announcement_text: string | null
  hero_image_url: string | null
  hero_heading: string | null
  hero_subtext: string | null
  hero_cta: HeroCta | null
  trust_badges: TrustBadge[] | null
  // Policies
  return_policy: string | null
  shipping_policy: string | null
  privacy_policy: string | null
  terms_policy: string | null
  // Contact
  about_text: string | null
  contact_email: string | null
  contact_phone: string | null
  whatsapp_number: string | null
  instagram_url: string | null
  youtube_url: string | null
  gst_number: string | null
  business_address: string | null
  // SEO
  seo_title: string | null
  seo_description: string | null
  seo_og_image_url: string | null
  // Commerce
  free_shipping_threshold: number | null
  cod_enabled: boolean
  whatsapp_notifications_enabled: boolean
}

// ---------------------------------------------------------------------------
// Font stacks — matching the admin font picker values
// ---------------------------------------------------------------------------

const FONT_STACKS: Record<string, string> = {
  inter:       "'Inter', ui-sans-serif, system-ui, sans-serif",
  poppins:     "'Poppins', ui-sans-serif, system-ui, sans-serif",
  playfair:    "'Playfair Display', Georgia, 'Times New Roman', serif",
  lato:        "'Lato', ui-sans-serif, system-ui, sans-serif",
  raleway:     "'Raleway', ui-sans-serif, system-ui, sans-serif",
  montserrat:  "'Montserrat', ui-sans-serif, system-ui, sans-serif",
}

// Google Fonts URL for a given font key
const GOOGLE_FONT_URLS: Record<string, string> = {
  inter:       "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  poppins:     "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  playfair:    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap",
  lato:        "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
  raleway:     "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap",
  montserrat:  "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
}

// ---------------------------------------------------------------------------
// Fetch store config for the current tenant
// ---------------------------------------------------------------------------

export async function fetchStoreConfig(
  tenant: TenantResolution
): Promise<StoreConfig | null> {
  try {
    const medusa = getTenantMedusa(tenant)
    const data = await medusa.client.fetch<{ config: StoreConfig | null }>(
      "/store/selfkart/store-config",
      { cache: "no-store" }
    )
    return data.config ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Build the CSS custom-properties string injected onto <html style="...">
// ---------------------------------------------------------------------------

export function buildCssVars(config: StoreConfig | null): React.CSSProperties {
  const primary   = config?.primary_color   ?? "#111111"
  const accent    = config?.accent_color    ?? "#374151"
  const secondary = config?.secondary_color ?? "#ffffff"
  const headingStack = FONT_STACKS[config?.font_heading ?? "inter"] ?? FONT_STACKS.inter
  const bodyStack    = FONT_STACKS[config?.font_body    ?? "inter"] ?? FONT_STACKS.inter
  const mode = config?.color_mode ?? "light"

  return {
    "--store-primary":      primary,
    "--store-accent":       accent,
    "--store-secondary":    secondary,
    "--store-font-heading": headingStack,
    "--store-font-body":    bodyStack,
    colorScheme:            mode,
  } as React.CSSProperties
}

// ---------------------------------------------------------------------------
// Return unique Google Font URLs needed for a config
// ---------------------------------------------------------------------------

export function getFontLinks(config: StoreConfig | null): string[] {
  const keys = new Set<string>()
  if (config?.font_heading) keys.add(config.font_heading)
  if (config?.font_body)    keys.add(config.font_body)
  return [...keys]
    .map((k) => GOOGLE_FONT_URLS[k])
    .filter(Boolean) as string[]
}
