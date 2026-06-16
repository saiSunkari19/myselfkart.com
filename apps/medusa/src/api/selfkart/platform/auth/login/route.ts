import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  generateSessionToken,
  hashSessionToken,
  newId,
  normalizeEmail,
  sessionExpiry,
  verifyPassword,
} from "../../../../../platform/auth"
import {
  createSession,
  deleteExpiredSessions,
  findAdminByEmail,
} from "../../../../../platform/repository"

/**
 * Platform operator login. Exempt from the platform auth middleware (it cannot
 * require a session to create one). On success it mints an opaque bearer token,
 * stores only its hash, and returns the raw token to the console server, which
 * keeps it in an httpOnly cookie.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>
  const email = normalizeEmail(body.email)
  const password = typeof body.password === "string" ? body.password : ""

  // Uniform failure so the response cannot distinguish "no such admin" from
  // "wrong password".
  const fail = () => {
    res.status(401).json({ message: "Invalid credentials" })
  }

  if (!email || !password) {
    fail()
    return
  }

  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const admin = await findAdminByEmail(knex, email)

  if (!admin || admin.disabled_at || !verifyPassword(password, admin.password_hash)) {
    fail()
    return
  }

  const token = generateSessionToken()
  const now = Date.now()
  await createSession(knex, {
    id: newId("psess"),
    adminId: admin.id,
    tokenHash: hashSessionToken(token),
    expiresAt: sessionExpiry(now),
  })
  // Opportunistic cleanup; cheap and keeps the table from growing unbounded.
  await deleteExpiredSessions(knex).catch(() => undefined)

  res.json({
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  })
}
