import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"
import type { Knex } from "knex"

import { runWithTenantContext } from "../modules/tenant-context"

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
/**
 * Callable form used by the platform onboarding orchestrator (provision-seller).
 * The CLI default export below just reads env into `input` and delegates here.
 */
export async function provisionSellerAdmin(
  container: ExecArgs["container"],
  input: SellerAdminInput
): Promise<void> {
  const { tenantId, email, password } = input

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const authService = container.resolve(Modules.AUTH)
  const userService = container.resolve(Modules.USER)
  const workflowEngine = container.resolve(Modules.WORKFLOW_ENGINE)

  // 1. Reuse an existing user with this email, otherwise create one. The "user"
  // table is now tenant-RLS'd (Concern 2): both the lookup and the insert must
  // run inside the tenant context so the lookup is scoped and the insert's
  // tenant_id is stamped by the trigger and satisfies the RLS WITH CHECK.
  const userId = await runWithTenantContext(
    { tenantId, source: "session" },
    async () => {
      const existingUsers = await userService.listUsers({ email })

      if (existingUsers.length > 0) {
        logger.info(`Reusing existing user ${existingUsers[0].id} for ${email}`)
        return existingUsers[0].id
      }

      const { result: users } = await workflowEngine.run("create-users-workflow", {
        input: { users: [{ email }] },
      })
      logger.info(`Created user ${users[0].id} for ${email}`)
      return users[0].id
    }
  )

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

    // register() does NOT touch the password when the identity already exists, so
    // a retry would otherwise return a tempPassword that doesn't actually work.
    // Reset it to the requested password so re-provisioning yields a usable
    // credential. Safe: only pending/failed applications can be (re-)approved.
    const { success: updated, error: updateError } = await authService.updateProvider(
      PROVIDER,
      { entity_id: email, password }
    )
    if (!updated) {
      throw new Error(
        `Could not reset password for existing emailpass identity ${email}: ${updateError ?? "unknown error"}`
      )
    }
    logger.info(`Reusing existing emailpass identity for ${email} (password reset)`)
  }

  // 3. Link actor + tenant on the auth identity (this is what the JWT carries).
  // auth_identity is intentionally NOT tenant-RLS'd (login resolves it before a
  // tenant is known), so this runs without a tenant context.
  await authService.updateAuthIdentities({
    id: authIdentityId,
    app_metadata: {
      user_id: userId,
      tenant_id: tenantId,
    },
  })

  // The user.tenant_id binding was stamped by the RLS trigger during creation
  // (step 1, inside the tenant context) — no separate UPDATE is needed.

  logger.info(
    `Seller admin ready: email=${email} user_id=${userId} tenant_id=${tenantId}`
  )
}

export default async function createSellerAdmin({ container }: ExecArgs): Promise<void> {
  await provisionSellerAdmin(container, readInput())
}
