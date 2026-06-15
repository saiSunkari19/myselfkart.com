import { AsyncLocalStorage } from "node:async_hooks"

export type TenantContext = {
  tenantId: string
  source: "domain" | "session" | "test"
}

const storage = new AsyncLocalStorage<TenantContext>()

export function runWithTenantContext<T>(
  context: TenantContext,
  callback: () => T
): T {
  return storage.run(context, callback)
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore()
}

export function requireTenantContext(): TenantContext {
  const context = getTenantContext()

  if (!context?.tenantId) {
    throw new Error("Tenant context is required for tenant-scoped database access")
  }

  return context
}
