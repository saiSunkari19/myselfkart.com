import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { runWithTenantContext } from "./store"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function tenantContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const tenantHeader = req.headers["x-selfkart-test-tenant-id"]
  const tenantId = Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader

  if (typeof tenantId !== "string" || !UUID_PATTERN.test(tenantId)) {
    return res.status(403).json({
      message: "Valid tenant context is required",
    })
  }

  return runWithTenantContext({ tenantId, source: "test" }, () => next())
}
