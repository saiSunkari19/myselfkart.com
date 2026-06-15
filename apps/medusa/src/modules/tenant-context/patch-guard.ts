import { ModulesSdkUtils } from "@medusajs/utils"

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
