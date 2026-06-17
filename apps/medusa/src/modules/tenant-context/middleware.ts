import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { verifyStorefrontSignature } from "./domain-auth"
import { runWithTenantContext, type TenantContext } from "./store"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeUuid(value: unknown): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === "string" && UUID_PATTERN.test(candidate)
    ? candidate
    : undefined
}

function firstHeader(value: unknown): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === "string" ? candidate : undefined
}

type TransactionLike = {
  raw: (sql: string, bindings?: unknown[]) => Promise<unknown>
  commit: () => Promise<unknown>
  rollback: () => Promise<unknown>
}

type PgConnectionLike = {
  transaction: () => Promise<TransactionLike>
}

const READ_TRANSACTION_METHODS = new Set(["GET", "HEAD"])

function shouldUseReadTransaction(req: MedusaRequest): boolean {
  return READ_TRANSACTION_METHODS.has(req.method.toUpperCase())
}

function resolvePgConnection(req: MedusaRequest): PgConnectionLike | undefined {
  const scope = (req as MedusaRequest & {
    scope?: { resolve?: (key: string) => unknown }
  }).scope

  return scope?.resolve?.(ContainerRegistrationKeys.PG_CONNECTION) as
    | PgConnectionLike
    | undefined
}

async function runWithTenantRequestContext(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
  context: TenantContext
) {
  const pgConnection = shouldUseReadTransaction(req)
    ? resolvePgConnection(req)
    : undefined

  if (!pgConnection?.transaction) {
    return runWithTenantContext(context, () => next())
  }

  let readTransaction: TransactionLike | undefined

  try {
    readTransaction = await pgConnection.transaction()
    await readTransaction.raw("select set_config('app.current_tenant', ?, true)", [
      context.tenantId,
    ])
  } catch (error) {
    if (readTransaction) {
      await readTransaction.rollback().catch(() => undefined)
    }

    return next(error)
  }

  let settled = false
  const settle = async (action: "commit" | "rollback") => {
    if (settled || !readTransaction) {
      return
    }

    settled = true
    res.off("finish", commit)
    res.off("close", rollback)

    await readTransaction[action]().catch(() => undefined)
  }
  const commit = () => {
    void settle("commit")
  }
  const rollback = () => {
    void settle(res.writableEnded ? "commit" : "rollback")
  }

  res.once("finish", commit)
  res.once("close", rollback)

  return runWithTenantContext(
    { ...context, readTransaction },
    () => next()
  )
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
    return runWithTenantRequestContext(
      req,
      res,
      next,
      { tenantId: testTenantId, source: "test" }
    )
  }

  const tenantId = resolveSessionTenant(req)
  if (!tenantId) {
    return res.status(403).json({
      message: "Valid tenant context is required",
    })
  }

  return runWithTenantRequestContext(
    req,
    res,
    next,
    { tenantId, source: "session" }
  )
}

/**
 * Domain tenant resolution for /store*.
 *
 * The Next.js storefront resolves the tenant from the request Host server-side,
 * then calls Medusa with the tenant_id plus an HMAC-SHA256 signature over it
 * (signed with SELFKART_STOREFRONT_SECRET, which only the Next.js server holds).
 * The browser cannot forge this, so the tenant is derived from a trusted source.
 * Postgres RLS still fail-closes for any /store* query that reaches here without
 * valid context, so there is no leak even if this middleware is bypassed.
 */
export function domainTenantContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const testTenantId = resolveTestTenant(req)
  if (testTenantId) {
    return runWithTenantRequestContext(
      req,
      res,
      next,
      { tenantId: testTenantId, source: "test" }
    )
  }

  const tenantId = normalizeUuid(req.headers["x-selfkart-tenant-id"])
  const signature = firstHeader(req.headers["x-selfkart-tenant-sig"])

  if (!tenantId || !verifyStorefrontSignature(tenantId, signature)) {
    return res.status(403).json({
      message: "Valid tenant context is required",
    })
  }

  return runWithTenantRequestContext(
    req,
    res,
    next,
    { tenantId, source: "domain" }
  )
}
