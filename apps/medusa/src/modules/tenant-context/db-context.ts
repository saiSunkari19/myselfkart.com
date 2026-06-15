import { requireTenantContext } from "./store"

export function getSetLocalTenantSql(): [string, string[]] {
  const { tenantId } = requireTenantContext()

  return ["select set_config('app.current_tenant', ?, true)", [tenantId]]
}
