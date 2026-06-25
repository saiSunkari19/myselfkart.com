import { shiprocketLogin } from "./client"

/**
 * SH-2: per-tenant Shiprocket Bearer-token cache. Tokens last ~240h; we refresh
 * when fewer than 24h remain. In-memory per process — acceptable because a fresh
 * mint is cheap and the cache self-heals after a restart. Keyed by tenant id so
 * one process safely serves many sellers' Shiprocket accounts.
 */
type Cached = { token: string; expiresAt: number }
const cache = new Map<string, Cached>()

const TTL_MS = 240 * 60 * 60 * 1000 // 240h
const REFRESH_BEFORE_MS = 24 * 60 * 60 * 1000 // refresh when <24h left

export async function getShiprocketToken(
  tenantId: string,
  email: string,
  password: string
): Promise<string> {
  const now = Date.now()
  const cached = cache.get(tenantId)
  if (cached && cached.expiresAt - now > REFRESH_BEFORE_MS) {
    return cached.token
  }
  const token = await shiprocketLogin(email, password)
  cache.set(tenantId, { token, expiresAt: now + TTL_MS })
  return token
}

/** Drop a tenant's cached token (e.g. after an auth failure or creds change). */
export function clearShiprocketToken(tenantId: string): void {
  cache.delete(tenantId)
}
