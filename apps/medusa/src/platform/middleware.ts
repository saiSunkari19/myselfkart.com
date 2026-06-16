import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { hashSessionToken } from "./auth"
import { findAdminBySessionToken } from "./repository"
import type { PlatformAdmin } from "./repository"

const SESSION_HEADER = "x-platform-session"

/**
 * Authenticates a platform operator for `/selfkart/platform/*`.
 *
 * The superadmin console (apps/superadmin) is server-side only: the browser
 * never calls Medusa directly. The console's Next.js server holds the opaque
 * session token in an httpOnly cookie and forwards it here as `x-platform-session`.
 * We hash it and match a live session row; the raw token is never stored.
 *
 * The login route mints sessions, so it is exempt. Everything else under
 * /selfkart/platform/* requires a valid session and attaches the resolved admin
 * to `req.platformAdmin`.
 */
export type PlatformAuthedRequest = MedusaRequest & {
  platformAdmin?: PlatformAdmin
}

export function platformAuthMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): void {
  // The login endpoint cannot itself require a session.
  //
  // NOTE: this middleware is mounted via `app.use("/selfkart/platform*", ...)`,
  // and Express strips the matched mount prefix from `req.path` inside the
  // handler (here `req.path` is just "/"). Match the full original URL instead,
  // dropping any query string.
  const pathname = (req.originalUrl || req.url).split("?")[0]
  if (pathname.endsWith("/platform/auth/login")) {
    next()
    return
  }

  const header = req.headers[SESSION_HEADER]
  const token = Array.isArray(header) ? header[0] : header

  if (typeof token !== "string" || token.length === 0) {
    res.status(401).json({ message: "Platform authentication required" })
    return
  }

  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  findAdminBySessionToken(knex, hashSessionToken(token))
    .then((admin) => {
      if (!admin) {
        res.status(401).json({ message: "Invalid or expired session" })
        return
      }
      ;(req as PlatformAuthedRequest).platformAdmin = admin
      next()
    })
    .catch(next)
}
