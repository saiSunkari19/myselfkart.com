import type { StoreTheme } from "./types"
import { DefaultTheme } from "./default"
import { VoltTheme } from "../../app/preview/volt/_theme"
import { GlowTheme } from "../../app/preview/glow/_theme"

/**
 * Theme registry. Each storefront design implements `StoreTheme` and is
 * registered here by its `template_id`. Routes call `getTheme(config.template_id)`
 * and render the returned slots — never a per-route `switch`.
 *
 * Themes are migrated into this registry phase by phase (see
 * docs/themed-routes-architecture.md). Until a template_id is registered,
 * `getTheme` returns `DefaultTheme`, so every tenant always renders something
 * coherent.
 */
export const THEMES = {
  volt: VoltTheme,
  glow: GlowTheme,
} satisfies Record<string, StoreTheme>

export function getTheme(templateId?: string | null): StoreTheme {
  return (THEMES as Record<string, StoreTheme>)[templateId ?? ""] ?? DefaultTheme
}

export { DefaultTheme }
export type { StoreTheme } from "./types"
