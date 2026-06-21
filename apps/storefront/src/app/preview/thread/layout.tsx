"use client"
import type { ReactNode } from "react"
import { TemplateConfigProvider } from "../../../lib/template-config-context"

export default function ThreadLayout({ children }: { children: ReactNode }) {
  return (
    <TemplateConfigProvider config={null} basePath="/preview/thread">
      {children}
    </TemplateConfigProvider>
  )
}
