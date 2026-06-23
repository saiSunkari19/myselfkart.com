"use client"

import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import type { StoreConfig } from "./store-config"
import type { CategoryView } from "./views"

type TemplateContextValue = {
  config: StoreConfig | null
  basePath: string // "" in live mode, "/preview/volt" etc. in static preview
  /** Total item quantity in the visitor's cart, for the nav's bag/cart badge. */
  cartCount: number
  /** Whether to surface the Deals link (true only when real deals exist). */
  hasDeals: boolean
  categories: CategoryView[]
}

const TemplateConfigContext = createContext<TemplateContextValue>({
  config: null,
  basePath: "",
  cartCount: 0,
  hasDeals: false,
  categories: [],
})

export function useTemplateConfig() {
  return useContext(TemplateConfigContext)
}

export function TemplateConfigProvider({
  config,
  basePath,
  cartCount = 0,
  hasDeals = false,
  categories = [],
  children,
}: {
  config: StoreConfig | null
  basePath: string
  cartCount?: number
  hasDeals?: boolean
  categories?: CategoryView[]
  children: ReactNode
}) {
  return (
    <TemplateConfigContext.Provider value={{ config, basePath, cartCount, hasDeals, categories }}>
      {children}
    </TemplateConfigContext.Provider>
  )
}
