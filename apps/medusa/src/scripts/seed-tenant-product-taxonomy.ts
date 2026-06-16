import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  extractSellerImportSeeds,
  linkSellerImportProducts,
  parseCsv,
  upsertSellerImportTaxonomy,
} from "../modules/selfkart-product-import"
import { runWithTenantContext } from "../modules/tenant-context"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readTenantId(): string {
  const tenantId = process.env.SELLER_ADMIN_TENANT_ID ?? process.env.TENANT_ID ?? ""

  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("SELLER_ADMIN_TENANT_ID or TENANT_ID must be a valid UUID")
  }

  return tenantId
}

function defaultCsvPath(): string {
  const rootOutput = path.resolve(
    process.cwd(),
    "../../outputs/medusa-cloth-store-taxonomy-associations.csv"
  )

  if (existsSync(rootOutput)) {
    return rootOutput
  }

  return path.resolve(process.cwd(), "outputs/medusa-cloth-store-taxonomy-associations.csv")
}

export default async function seedTenantProductTaxonomy({
  container,
}: ExecArgs): Promise<void> {
  const tenantId = readTenantId()
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const csvPath = path.resolve(
    process.cwd(),
    process.env.PRODUCT_TAXONOMY_CSV ?? defaultCsvPath()
  )
  const rows = parseCsv(await readFile(csvPath, "utf8"))
  const seeds = extractSellerImportSeeds(rows, tenantId)

  await runWithTenantContext({ tenantId, source: "session" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      await upsertSellerImportTaxonomy(trx, tenantId, seeds)

      const linkedProducts = await linkSellerImportProducts(trx, seeds.associations)

      logger.info(
        `Tenant taxonomy ready: collections=${seeds.collections.length} types=${seeds.types.length} tags=${seeds.tags.length} categories=${seeds.categories.length} linked_products=${linkedProducts}`
      )
    })
  })
}
