import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Next.js 16 network-boundary proxy (formerly `middleware`).
 *
 * Defense-in-depth: the tenant is derived server-side from the Host and the
 * trusted Medusa channel is signed with a server-only secret, so a browser
 * cannot assert tenant context. To be safe even against header smuggling, strip
 * any inbound `x-selfkart-*` trust headers before the request reaches the app —
 * only the server-side Medusa client is allowed to set them, and only on its
 * outbound calls to Medusa.
 */
const STRIPPED_HEADERS = [
  "x-selfkart-tenant-id",
  "x-selfkart-tenant-sig",
  "x-selfkart-host-sig",
  "x-selfkart-test-tenant-id",
]

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  let stripped = false
  for (const header of STRIPPED_HEADERS) {
    if (headers.has(header)) {
      headers.delete(header)
      stripped = true
    }
  }

  if (!stripped) {
    return NextResponse.next()
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Run on app routes, skip Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
