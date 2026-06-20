import { resolveTenant } from "../../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../../lib/store-config"
import type { StoreConfig } from "../../../lib/store-config"

export async function getGlowConfig(): Promise<StoreConfig | null> {
  const tenant = await resolveTenant()
  return tenant ? fetchStoreConfig(tenant) : null
}

export function glowColorVars(config: StoreConfig | null): React.CSSProperties {
  return {
    ...(config?.primary_color ? { "--charcoal": config.primary_color } : {}),
    ...(config?.accent_color  ? { "--gold":     config.accent_color  } : {}),
  } as React.CSSProperties
}
