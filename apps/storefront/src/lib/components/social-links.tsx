import type { ReactElement } from "react"
import type { StoreConfig } from "../store-config"

/**
 * Renders Instagram/YouTube icon links from store config, skipping any that
 * aren't set. Shared across themes so footers don't each reinvent (or omit)
 * actual icon markup.
 */
export function SocialLinks({
  config,
  size = 18,
  color = "currentColor",
  gap = 12,
  className,
  itemClassName,
}: {
  config?: Pick<StoreConfig, "instagram_url" | "youtube_url"> | null
  size?: number
  color?: string
  gap?: number
  className?: string
  /** Applied to each <a> instead of the default inline style — use when the theme already has a footer icon-button class. */
  itemClassName?: string
}) {
  const links = [
    config?.instagram_url ? { href: config.instagram_url, label: "Instagram", icon: <InstagramIcon size={size} /> } : null,
    config?.youtube_url ? { href: config.youtube_url, label: "YouTube", icon: <YouTubeIcon size={size} /> } : null,
  ].filter((l): l is { href: string; label: string; icon: ReactElement } => l !== null)

  if (links.length === 0) return null

  return (
    <div className={className} style={itemClassName ? undefined : { display: "flex", gap, color }}>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          aria-label={l.label}
          className={itemClassName}
          style={itemClassName ? undefined : { color: "inherit", display: "inline-flex" }}
        >
          {l.icon}
        </a>
      ))}
    </div>
  )
}

function InstagramIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YouTubeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5l4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}
