"use client"
import type { ReactNode } from "react"
import { TemplateConfigProvider } from "../../../lib/template-config-context"

export default function AurumLayout({ children }: { children: ReactNode }) {
  return (
    <TemplateConfigProvider config={null} basePath="/preview/aurum">
      {children}
    </TemplateConfigProvider>
  )
}
