import "server-only"

import { getSessionToken } from "./session"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export class PlatformApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

type FetchOptions = {
  method?: string
  body?: unknown
  /** Attach the operator session token (default true). */
  authed?: boolean
}

/**
 * Server-side fetch to the Medusa platform API. Attaches the operator session
 * token as `x-platform-session` for authed calls. Throws PlatformApiError on a
 * non-2xx so callers can branch on `.status` (e.g. 401 -> redirect to login).
 */
export async function platformFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, authed = true } = options
  const headers: Record<string, string> = { "content-type": "application/json" }

  if (authed) {
    const token = await getSessionToken()
    if (token) {
      headers["x-platform-session"] = token
    }
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  const text = await res.text()
  const parsed = text ? safeJson(text) : null

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as Record<string, unknown>).message)
        : null) || `Request failed (${res.status})`
    throw new PlatformApiError(res.status, message, parsed)
  }

  return parsed as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
