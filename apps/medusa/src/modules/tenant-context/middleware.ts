import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { runWithTenantContext } from "./store"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeUuid(value: unknown): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === "string" && UUID_PATTERN.test(candidate)
    ? candidate
    : undefined
}

/**
 * Test-only tenant resolution.
 *
 * Enabled solely when SELFKART_ALLOW_TEST_TENANT_HEADER === "true" so the
 * Phase 0B RLS integration tests can drive a tenant without a real login.
 * It is never honoured in normal runtime, so a browser/API client cannot spoof
 * a tenant via this header.
 */
function resolveTestTenant(req: MedusaRequest): string | undefined {
  if (
    process.env.SELFKART_ALLOW_TEST_TENANT_HEADER !== "true" ||
    process.env.NODE_ENV === "production"
  ) {
    return undefined
  }
  return normalizeUuid(req.headers["x-selfkart-test-tenant-id"])
}

/**
 * Session tenant resolution for /admin*.
 *
 * The framework's authenticate("user") middleware runs BEFORE this one and
 * populates req.auth_context from the JWT/session. The admin JWT carries the
 * full auth_identity.app_metadata, into which create-seller-admin stamped the
 * tenant_id — so we read it here with no database round-trip.
 */
function resolveSessionTenant(req: MedusaRequest): string | undefined {
  const authContext = (req as AuthenticatedMedusaRequest).auth_context
  const appMetadata = authContext?.app_metadata as
    | Record<string, unknown>
    | undefined
  return normalizeUuid(appMetadata?.tenant_id)
}

export function tenantContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const testTenantId = resolveTestTenant(req)
  if (testTenantId) {
    return runWithTenantContext(
      { tenantId: testTenantId, source: "test" },
      () => next()
    )
  }

  const tenantId = resolveSessionTenant(req)
  if (!tenantId) {
    return res.status(403).json({
      message: "Valid tenant context is required",
    })
  }

  return runWithTenantContext({ tenantId, source: "session" }, () => next())
}
