"use client"

import { TemplateConfigProvider } from "../../../lib/template-config-context"

// Static preview uses /preview/volt/* base path, no live config
export default function VoltLayout({ children }: { children: React.ReactNode }) {
  return (
    <TemplateConfigProvider config={null} basePath="/preview/volt">
      {children}
    </TemplateConfigProvider>
  )
}
