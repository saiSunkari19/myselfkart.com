/**
 * Pure host-matching helpers for tenant/demo-host resolution.
 *
 * Kept free of `server-only`, `next/headers`, and any runtime imports so the
 * decision logic is unit-testable in isolation (resolve-tenant.ts itself can't
 * be imported by the test harness — it pulls in `server-only`).
 */

/**
 * Normalize a Host header value for registry/demo matching: first value only
 * (a comma-joined `x-forwarded-host` list), trimmed, lowercased, port stripped.
 */
export function normalizeHost(raw: string | null | undefined): string {
  if (!raw) {
    return ""
  }
  return raw.split(",")[0].trim().toLowerCase().split(":")[0]
}

/**
 * True when `host` matches any entry in the comma-separated `demoEnv`
 * (`SELFKART_STOREFRONT_DEMO_HOST`). Both sides are normalized, so casing,
 * ports, and proxy `x-forwarded-host` lists all compare correctly. Returns
 * false for an empty host or empty/unset env (the safe default: no demo).
 */
export function matchesDemoHost(
  host: string | null | undefined,
  demoEnv: string | null | undefined
): boolean {
  const target = normalizeHost(host)
  if (!target) {
    return false
  }
  const demoHosts = (demoEnv ?? "").split(",").map(normalizeHost).filter(Boolean)
  return demoHosts.includes(target)
}
