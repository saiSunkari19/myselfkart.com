"use client"

import type { CSSProperties, ReactNode } from "react"

/**
 * Neutral, theme-agnostic UI primitives for the account / auth surfaces. Themes
 * wrap these in their own chrome (nav/footer/container) and pass their accent
 * colour; the controls themselves stay clean and readable on any palette.
 */

export const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e5e4",
  borderRadius: 14,
  padding: 24,
}

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#57534e",
  marginBottom: 6,
}

export const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d6d3d1",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: "#1c1917",
  background: "#fff",
  outline: "none",
}

export function primaryBtnStyle(accent: string, disabled?: boolean): CSSProperties {
  return {
    width: "100%",
    padding: "12px 16px",
    background: accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.7 : 1,
  }
}

export const ghostBtnStyle: CSSProperties = {
  padding: "8px 14px",
  background: "transparent",
  border: "1px solid #d6d3d1",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: "#1c1917",
  cursor: "pointer",
}

export const errorBoxStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#dc2626",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  marginBottom: 14,
}

export const noticeBoxStyle: CSSProperties = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#166534",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  marginBottom: 14,
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

export function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}
