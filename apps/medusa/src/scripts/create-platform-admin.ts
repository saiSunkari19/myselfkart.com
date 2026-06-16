import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { hashPassword, isValidEmail, newId, normalizeEmail } from "../platform/auth"
import { findAdminByEmail, insertAdmin } from "../platform/repository"

/**
 * Creates (or resets, idempotently per email) a platform operator for the
 * superadmin console. Mirrors create-seller-admin, but for the cross-tenant
 * platform — these admins are NOT tenant-bound and never log in at /app.
 *
 * Env:
 *   PLATFORM_ADMIN_EMAIL     required
 *   PLATFORM_ADMIN_PASSWORD  required, >= 10 chars
 *   PLATFORM_ADMIN_NAME      default "Platform Operator"
 *   PLATFORM_ADMIN_ROLE      owner|operator (default operator)
 */
export default async function createPlatformAdmin({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  const email = normalizeEmail(process.env.PLATFORM_ADMIN_EMAIL)
  const password = process.env.PLATFORM_ADMIN_PASSWORD ?? ""
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || "Platform Operator"
  const role = process.env.PLATFORM_ADMIN_ROLE === "owner" ? "owner" : "operator"

  if (!isValidEmail(email)) {
    throw new Error("PLATFORM_ADMIN_EMAIL must be a valid email")
  }
  if (password.length < 10) {
    throw new Error("PLATFORM_ADMIN_PASSWORD is required and must be at least 10 characters")
  }

  const existing = await findAdminByEmail(knex, email)
  await insertAdmin(knex, {
    id: existing?.id ?? newId("padm"),
    email,
    name,
    password_hash: hashPassword(password),
    role,
  })

  logger.info(
    `Platform admin ${existing ? "updated" : "created"}: email=${email} role=${role}`
  )
}
