import { Module } from "@medusajs/framework/utils"

import TenantContextModuleService from "./service"

export const TENANT_CONTEXT_MODULE = "tenantContext"

export default Module(TENANT_CONTEXT_MODULE, {
  service: TenantContextModuleService,
})

export * from "./db-context"
export * from "./middleware"
export * from "./patch-guard"
export * from "./store"
