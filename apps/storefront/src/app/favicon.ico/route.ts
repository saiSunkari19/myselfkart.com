import { NextResponse } from "next/server"

import { resolveTenant } from "../../lib/tenant/resolve-tenant"
import { fetchStoreConfig } from "../../lib/store-config"

const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#16181d"/>
  <path fill="#fff" d="M17 20h30l-3 25H20L17 20Zm7 6 2 13h12l2-13H24Z"/>
</svg>`

export async function GET() {
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null

  if (config?.favicon_url) {
    return NextResponse.redirect(config.favicon_url)
  }

  return new Response(DEFAULT_ICON, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "image/svg+xml",
    },
  })
}
