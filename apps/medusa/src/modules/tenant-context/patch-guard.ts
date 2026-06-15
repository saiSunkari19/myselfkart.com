import { readFileSync, realpathSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

import { ModulesSdkUtils } from "@medusajs/utils"

const READ_PATH_PATCH_MARKER = "selfkart-tenant-read-rls"

/**
 * Asserts the @mikro-orm/knex read-path patch is applied.
 *
 * Medusa's read path (query.graph / @InjectManager finds) runs without a
 * transaction, so the @medusajs/utils transaction hook never sets
 * app.current_tenant on reads and Postgres RLS fail-closes (a tenant sees zero
 * rows). The patch wraps tenant-scoped reads in a transaction so the hook fires.
 *
 * App-root resolution finds the UNPATCHED hoisted @mikro-orm/knex; the copy the
 * ORM actually loads is resolved transitively via
 * @medusajs/medusa -> @mikro-orm/postgresql -> @mikro-orm/knex (the pnpm-patched
 * variant), so we anchor resolution there.
 */
export function assertTenantReadPathPatchApplied(): void {
  const localRequire = createRequire(__filename)
  const fromMedusa = createRequire(
    realpathSync(localRequire.resolve("@medusajs/medusa/package.json"))
  )
  const fromPostgres = createRequire(
    realpathSync(fromMedusa.resolve("@mikro-orm/postgresql/package.json"))
  )
  const knexPkg = realpathSync(fromPostgres.resolve("@mikro-orm/knex/package.json"))
  const connectionFile = join(dirname(knexPkg), "AbstractSqlConnection.js")

  if (!readFileSync(connectionFile, "utf8").includes(READ_PATH_PATCH_MARKER)) {
    throw new Error(
      "Selfkart tenant read-path patch is not applied to @mikro-orm/knex@6.6.12. " +
        "Run `corepack pnpm install` to apply patches/@mikro-orm__knex@6.6.12.patch."
    )
  }
}

export function assertTenantTransactionPatchApplied(): void {
  const connection = ModulesSdkUtils.createPgConnection({
    clientUrl: "postgres://selfkart:selfkart@127.0.0.1/selfkart_patch_guard",
    schema: "public",
    pool: { min: 0, max: 1 },
  })

  try {
    if (!String(connection.transaction).includes("selfkartTenantAwareTransaction")) {
      throw new Error(
        "Selfkart tenant transaction patch is not applied to @medusajs/utils@2.15.5"
      )
    }
  } finally {
    void connection.destroy()
  }
}
