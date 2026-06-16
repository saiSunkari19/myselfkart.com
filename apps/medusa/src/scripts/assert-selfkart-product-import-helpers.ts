import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  extractSellerImportSeeds,
  parseCsv,
  scopedImportId,
  toCsv,
  toMedusaImportRows,
} from "../modules/selfkart-product-import"

const { csv2json } = require("json-2-csv")
const coreFlowsRoot = path.dirname(path.dirname(require.resolve("@medusajs/core-flows")))
const { normalizeForImport } = require(path.join(
  coreFlowsRoot,
  "dist/product/helpers/normalize-for-import"
))
const { normalizeV1Products } = require(path.join(
  coreFlowsRoot,
  "dist/product/helpers/normalize-v1-import"
))

const TENANT_A = "00000000-0000-0000-0000-00000000000a"
const TENANT_B = "00000000-0000-0000-0000-00000000000b"

const SAMPLE_CSV = `Product Handle,Product Title,Product Collection Id,Product Collection Title,Product Type Id,Product Type Value,Product Tag 1,Product Tag 2,Parent Category Id,Parent Category Name,Parent Category Handle,Category Id,Category Name,Category Handle,Variant SKU
kids-rainbow-pocket-tee,Kids Rainbow Pocket Tee,pcol_selfkart_cloth_kids,Kids Clothing,ptyp_selfkart_cloth_graphic-t-shirts,Graphic T-Shirts,cloth-kids,material-cotton-jersey,pcat_selfkart_cloth_kids,Kids Clothing,cloth-kids,pcat_selfkart_cloth_kids_graphic-t-shirts,Graphic T-Shirts,cloth-kids-graphic-t-shirts,KID-001-23Y
`

function assertPreparedCsvCanNormalize(filePath: string) {
  if (!existsSync(filePath)) {
    return
  }

  const rows = parseCsv(readFileSync(filePath, "utf8"))
  const preparedCsv = toCsv(toMedusaImportRows(rows))
  const parsedRows = csv2json(preparedCsv, {
    preventCsvInjection: true,
    delimiter: { field: "," },
  })
  const v1Normalized = normalizeV1Products(parsedRows, {
    productTypes: [],
    productCollections: [],
    salesChannels: [],
    shippingProfiles: [],
  })
  const normalized = normalizeForImport(v1Normalized, { regions: [], tags: [] })
  const variants = normalized.flatMap((product: { variants: unknown[] }) => product.variants)

  for (const variant of variants as Array<{ title?: unknown; options?: Record<string, unknown> }>) {
    assert.equal(typeof variant.title, "string", `${filePath} variant title must be string`)
    for (const value of Object.values(variant.options ?? {})) {
      assert.equal(typeof value, "string", `${filePath} option values must be strings`)
    }
  }
}

export default async function assertSelfkartProductImportHelpers({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const rows = parseCsv(SAMPLE_CSV)
  const tenantASeeds = extractSellerImportSeeds(rows, TENANT_A)
  const tenantBSeeds = extractSellerImportSeeds(rows, TENANT_B)
  const medusaRows = toMedusaImportRows(rows)
  const medusaCsv = toCsv(medusaRows)

  assert.notEqual(
    scopedImportId(TENANT_A, "cloth-kids"),
    scopedImportId(TENANT_B, "cloth-kids"),
    "same seller CSV IDs must be scoped differently per tenant"
  )

  assert.equal(tenantASeeds.collections.length, 1)
  assert.equal(tenantASeeds.types.length, 1)
  assert.equal(tenantASeeds.tags.length, 2)
  assert.equal(tenantASeeds.categories.length, 2)
  assert.equal(tenantASeeds.associations.length, 1)

  assert.notEqual(
    tenantASeeds.tags[0]?.id,
    tenantBSeeds.tags[0]?.id,
    "taxonomy primary keys must not be reused across tenants"
  )

  assert.equal(
    medusaCsv.includes("cloth-kids"),
    false,
    "Medusa upload CSV must not contain raw seller taxonomy IDs"
  )
  assert.equal(medusaRows[0]?.["Product Handle"], "kids-rainbow-pocket-tee")
  assert.equal(medusaRows[0]?.["Variant SKU"], "KID-001-23Y")
  assert.equal(
    Object.prototype.hasOwnProperty.call(medusaRows[0], "Shipping Profile Id"),
    false,
    "Medusa upload CSV must omit empty/raw Shipping Profile Id columns"
  )

  assertPreparedCsvCanNormalize(
    path.resolve(process.cwd(), "../../outputs/medusa-cloth-store-products-50.csv")
  )
  assertPreparedCsvCanNormalize(path.resolve(process.cwd(), "../../ticket-products-import.csv"))

  logger.info("SELFKART IMPORT HELPERS PASS")
}

if (require.main === module) {
  void assertSelfkartProductImportHelpers({
    container: {
      resolve: () => console,
    },
  } as unknown as ExecArgs)
}
