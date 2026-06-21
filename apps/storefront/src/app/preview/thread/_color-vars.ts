import type { CSSProperties } from "react"

import type { StoreConfig } from "../../../lib/store-config"

/**
 * Pure helper — publish store-config brand colours on a wrapper (Thread CSS uses
 * hex). Lives in a plain (non-"use client") module so it can be called from both
 * client slots (`_live`, `_shop-live`, …) AND the server-rendered account/login
 * slots (`_account-live`). Calling a client-tainted function from a server
 * component throws ("Attempted to call threadColorVars() from the server").
 */
export function threadColorVars(config: StoreConfig | null): CSSProperties {
  return {
    ...(config?.primary_color ? { "--store-primary": config.primary_color } : {}),
    ...(config?.accent_color ? { "--store-accent": config.accent_color } : {}),
    ...(config?.secondary_color ? { "--store-secondary": config.secondary_color } : {}),
  } as CSSProperties
}
