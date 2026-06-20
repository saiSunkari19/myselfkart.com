import type { Metadata } from "next"
import type { ReactNode } from "react"

import { resolveTenant } from "../lib/tenant/resolve-tenant"
import { fetchStoreConfig, buildCssVars, getFontLinks } from "../lib/store-config"
import "./globals.css"

export const dynamic = "force-dynamic"

// Templates that ship their own nav + announcement bar; the default chrome below
// must stay hidden for these so it doesn't double up. A null template_id (no
// template picked yet) still gets the default header.
const SELF_CHROME_TEMPLATES = new Set([
  "glow",
  "volt",
  "thread",
  "aurum",
  "eventpass",
])

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null

  return {
    title: config?.seo_title ?? config?.store_name ?? "Store",
    description:
      config?.seo_description ??
      `Shop at ${config?.store_name ?? "our store"}.`,
    openGraph: config?.seo_og_image_url
      ? { images: [config.seo_og_image_url] }
      : undefined,
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const tenant = await resolveTenant()
  const config = tenant ? await fetchStoreConfig(tenant) : null

  const cssVars = buildCssVars(config)
  const fontLinks = getFontLinks(config)
  const storeName = config?.store_name ?? "Store"

  return (
    <html lang="en" style={cssVars}>
      <head>
        {/* Preconnect to Google Fonts for faster load */}
        {fontLinks.length > 0 && (
          <link rel="preconnect" href="https://fonts.googleapis.com" />
        )}
        {fontLinks.length > 0 && (
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
        )}
        {fontLinks.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {config?.favicon_url && (
          <link rel="icon" href={config.favicon_url} />
        )}
      </head>
      <body style={{ fontFamily: "var(--store-font-body)" }}>
        {/* Templates with their own nav/announcement handle this themselves */}
        {!SELF_CHROME_TEMPLATES.has(config?.template_id ?? "") && (
          <>
            {config?.announcement_enabled && config.announcement_text && (
              <div
                style={{
                  background: "var(--store-primary)",
                  color: "#fff",
                  textAlign: "center",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {config.announcement_text}
              </div>
            )}
            {config && (
              <header className="site-header" style={{ fontFamily: "var(--store-font-heading)" }}>
                <a href="/" style={{ color: "var(--store-primary)", fontSize: "1.1rem" }}>
                  {config.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={config.logo_url} alt={storeName} style={{ height: 32, objectFit: "contain" }} />
                  ) : (
                    storeName
                  )}
                </a>
                <a href="/cart">Cart</a>
              </header>
            )}
          </>
        )}

        {children}
      </body>
    </html>
  )
}
