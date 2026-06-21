import type { CSSProperties } from "react"

/**
 * Eventpass design tokens + the page-shell helper. Plain (non-"use client")
 * module so `pageShell()`/`T` can be used from BOTH the client slots AND the
 * server-rendered account/login slots (`_account-live`). A "use client" export
 * called from a server component throws ("Attempted to call pageShell() from the
 * server"). `_live` re-exports these so the client slot files are unaffected.
 */

// Design tokens (mirrors preview _components.tsx `T`, token-only)
export const T = {
  bg: "#ffffff",
  bgSubtle: "#f8f8fc",
  bgCard: "#ffffff",
  border: "#e5e7eb",
  borderSubtle: "#f0f0f6",
  text: "#0f0f0f",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  accent: "#6366f1",
  accentLight: "#eef2ff",
  accentHover: "#4f46e5",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
  shadowLg: "0 12px 40px rgba(0,0,0,0.1)",
  radius: 14,
  radiusSm: 10,
  radiusLg: 20,
}

export const FONT_FAMILY = "'Inter', ui-sans-serif, system-ui, sans-serif"

/** Shared page wrapper (background + font). */
export function pageShell(): CSSProperties {
  return { background: T.bg, minHeight: "100vh", fontFamily: FONT_FAMILY }
}
