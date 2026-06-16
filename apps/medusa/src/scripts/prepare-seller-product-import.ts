import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  extractSellerImportSeeds,
  parseCsv,
  toCsv,
  toMedusaImportRows,
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

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

export default async function prepareSellerProductImport({
  container,
}: ExecArgs): Promise<void> {
  const tenantId = readTenantId()
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const inputPath = path.resolve(process.cwd(), requireEnv("SELLER_PRODUCT_CSV"))
  const outputPath = path.resolve(process.cwd(), requireEnv("SELLER_PRODUCT_OUTPUT_CSV"))
  const rows = parseCsv(await readFile(inputPath, "utf8"))
  const medusaRows = toMedusaImportRows(rows)
  const seeds = extractSellerImportSeeds(rows, tenantId)

  await runWithTenantContext({ tenantId, source: "session" }, async () => {
    await knex.transaction(async (trx) => {
      await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
      await upsertSellerImportTaxonomy(trx, tenantId, seeds)
    })
  })

  await writeFile(outputPath, toCsv(medusaRows), "utf8")

  logger.info(
    `Prepared seller product import: rows=${rows.length} collections=${seeds.collections.length} types=${seeds.types.length} tags=${seeds.tags.length} categories=${seeds.categories.length} output=${outputPath}`
  )
}
