"use client"
import type { ReactNode } from "react"
import { TemplateConfigProvider } from "../../../lib/template-config-context"

export default function GlowLayout({ children }: { children: ReactNode }) {
  return (
    <TemplateConfigProvider config={null} basePath="/preview/glow">
      {children}
    </TemplateConfigProvider>
  )
}
