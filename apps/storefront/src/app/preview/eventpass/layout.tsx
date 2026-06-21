"use client"
import type { ReactNode } from "react"
import { TemplateConfigProvider } from "../../../lib/template-config-context"
import { CartProvider } from "./_cart"

export default function EventPassLayout({ children }: { children: ReactNode }) {
  return (
    <TemplateConfigProvider config={null} basePath="/preview/eventpass">
      <CartProvider>{children}</CartProvider>
    </TemplateConfigProvider>
  )
}
