"use client"

import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import type { StoreConfig } from "./store-config"

type TemplateContextValue = {
  config: StoreConfig | null
  basePath: string // "" in live mode, "/preview/volt" etc. in static preview
}

const TemplateConfigContext = createContext<TemplateContextValue>({
  config: null,
  basePath: "",
})

export function useTemplateConfig() {
  return useContext(TemplateConfigContext)
}

export function TemplateConfigProvider({
  config,
  basePath,
  children,
}: {
  config: StoreConfig | null
  basePath: string
  children: ReactNode
}) {
  return (
    <TemplateConfigContext.Provider value={{ config, basePath }}>
      {children}
    </TemplateConfigContext.Provider>
  )
}
