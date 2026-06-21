import type { CSSProperties } from "react"

import type { StoreConfig } from "../../../lib/store-config"

/**
 * Pure helper — publish store-config brand colours on an Aurum wrapper. Lives in
 * a plain (non-"use client") module so it can be called from both client slots
 * AND the server-rendered account/login slots (`_account-live`); a client-tainted
 * function called from a server component throws.
 */
export function aurumColorVars(config: StoreConfig | null): CSSProperties {
  return {
    ...(config?.accent_color ? { "--aurum-gold": config.accent_color } : {}),
    ...(config?.accent_color ? { "--aurum-gold-soft": config.accent_color } : {}),
    ...(config?.primary_color ? { "--aurum-ink": config.primary_color } : {}),
    ...(config?.secondary_color ? { "--aurum-bg": config.secondary_color } : {}),
  } as CSSProperties
}
