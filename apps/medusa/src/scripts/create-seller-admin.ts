import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import type { Knex } from "knex"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PROVIDER = "emailpass"

type SellerAdminInput = {
  tenantId: string
  email: string
  password: string
}

function readInput(): SellerAdminInput {
  const tenantId = process.env.SELLER_ADMIN_TENANT_ID ?? ""
  const email = process.env.SELLER_ADMIN_EMAIL ?? ""
  const password = process.env.SELLER_ADMIN_PASSWORD ?? ""

  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("SELLER_ADMIN_TENANT_ID must be a valid UUID")
  }
  if (!email) {
    throw new Error("SELLER_ADMIN_EMAIL is required")
  }
  if (password.length < 8) {
    throw new Error("SELLER_ADMIN_PASSWORD is required and must be at least 8 characters")
  }

  return { tenantId, email, password }
}

/**
 * Creates (or re-binds, idempotently) a seller admin user bound to one tenant.
 *
 * Mirrors Medusa's own `medusa user` flow (create user -> register emailpass
 * identity -> link via app_metadata), then adds the tenant binding:
 *   - auth_identity.app_metadata.tenant_id  -> rides into the admin JWT and is
 *     read by the /admin* tenant middleware (no DB round-trip at request time).
 *   - user.tenant_id                         -> durable source of truth.
 */
export default async function createSellerAdmin({ container }: ExecArgs) {
  const { tenantId, email, password } = readInput()

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const authService = container.resolve(Modules.AUTH)
  const userService = container.resolve(Modules.USER)
  const workflowEngine = container.resolve(Modules.WORKFLOW_ENGINE)

  // 1. Reuse an existing user with this email, otherwise create one.
  const existingUsers = await userService.listUsers({ email })
  let userId: string

  if (existingUsers.length > 0) {
    userId = existingUsers[0].id
    logger.info(`Reusing existing user ${userId} for ${email}`)
  } else {
    const { result: users } = await workflowEngine.run("create-users-workflow", {
      input: { users: [{ email }] },
    })
    userId = users[0].id
    logger.info(`Created user ${userId} for ${email}`)
  }

  // 2. Register the emailpass credential, or reuse it if already present.
  const { authIdentity, success, error } = await authService.register(PROVIDER, {
    body: { email, password },
  })

  let authIdentityId: string

  if (success && authIdentity) {
    authIdentityId = authIdentity.id
  } else {
    const existingIdentity = await knex("provider_identity")
      .where({ provider: PROVIDER, entity_id: email })
      .first("auth_identity_id")

    if (!existingIdentity) {
      throw new Error(
        `Could not register or locate an emailpass identity for ${email}: ${error ?? "unknown error"}`
      )
    }
    authIdentityId = existingIdentity.auth_identity_id
    logger.info(`Reusing existing emailpass identity for ${email}`)
  }

  // 3. Link actor + tenant on the auth identity (this is what the JWT carries).
  await authService.updateAuthIdentities({
    id: authIdentityId,
    app_metadata: {
      user_id: userId,
      tenant_id: tenantId,
    },
  })

  // 4. Stamp the durable binding on the user row (source of truth for Concern 2).
  await knex("user").where({ id: userId }).update({ tenant_id: tenantId })

  logger.info(
    `Seller admin ready: email=${email} user_id=${userId} tenant_id=${tenantId}`
  )
}
