import { randomBytes } from "node:crypto"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  findApplicationByTenantId,
  findTenantById,
  getTenantAdminEmail,
} from "../../../../../../platform/repository"

/** A throwaway strong password (~24 chars, mixed entropy). */
function generatePassword(): string {
  return randomBytes(18).toString("base64url")
}

/**
 * Sets (or generates) the seller admin's login password and returns it so the
 * operator can hand it to the seller. The seller then logs into /admin with this
 * email + password. The raw password is returned ONCE in this response and never
 * stored in plaintext (the auth module stores only a scrypt hash).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const id = req.params.id

  const tenant = await findTenantById(knex, id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }

  const email =
    (await getTenantAdminEmail(knex, id)) ??
    (await findApplicationByTenantId(knex, id))?.owner_email ??
    null
  if (!email) {
    res.status(409).json({ message: "No seller admin account found for this tenant" })
    return
  }

  // Optional caller-supplied password; otherwise generate one. Enforce Medusa's
  // 8-char minimum.
  const supplied = (req.body as { password?: unknown })?.password
  const password =
    typeof supplied === "string" && supplied.length > 0 ? supplied : generatePassword()
  if (password.length < 8) {
    res.status(422).json({ message: "Password must be at least 8 characters" })
    return
  }

  const authService = req.scope.resolve(Modules.AUTH)
  const { success, error } = await authService.updateProvider("emailpass", {
    entity_id: email,
    password,
  })
  if (!success) {
    res.status(500).json({ message: error || "Could not update password" })
    return
  }

  res.json({ email, password })
}
