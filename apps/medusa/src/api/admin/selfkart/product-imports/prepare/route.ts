import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  extractSellerImportSeeds,
  parseCsv,
  toCsv,
  toMedusaImportRows,
  upsertSellerImportTaxonomy,
} from "../../../../../modules/selfkart-product-import"
import { requireTenantContext } from "../../../../../modules/tenant-context"

type PrepareBody = {
  csv?: string
}

type UploadedFile = {
  buffer?: Buffer
}

function readUploadedCsv(req: MedusaRequest<PrepareBody>): string {
  const uploadReq = req as MedusaRequest<PrepareBody> & {
    file?: UploadedFile
    files?: UploadedFile[]
  }
  const file = uploadReq.file ?? uploadReq.files?.[0]

  if (file?.buffer) {
    return file.buffer.toString("utf8")
  }

  if (typeof req.body?.csv === "string" && req.body.csv.trim()) {
    return req.body.csv
  }

  throw new Error("Upload a CSV file or provide a csv body field")
}

export async function POST(req: MedusaRequest<PrepareBody>, res: MedusaResponse) {
  const { tenantId } = requireTenantContext()
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const rows = parseCsv(readUploadedCsv(req))
  const medusaRows = toMedusaImportRows(rows)
  const seeds = extractSellerImportSeeds(rows, tenantId)

  // Distinct product handles in the upload (rows repeat per variant).
  const handles = [
    ...new Set(
      medusaRows.map((row) => row["Product Handle"] ?? "").filter(Boolean)
    ),
  ]

  let existingProducts = 0
  await knex.transaction(async (trx) => {
    await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
    await upsertSellerImportTaxonomy(trx, tenantId, seeds)

    if (handles.length > 0) {
      // Products are matched by handle, so re-importing the same handles UPDATES
      // those products (never duplicates them). Surface the count so the seller
      // knows an import is an update, not a fresh create.
      const found = await trx("product")
        .whereIn("handle", handles)
        .whereNull("deleted_at")
        .pluck("handle")
      existingProducts = found.length
    }
  })

  res.status(200).json({
    medusa_csv: toCsv(medusaRows),
    summary: {
      rows: rows.length,
      products: handles.length,
      existing_products: existingProducts,
      new_products: Math.max(0, handles.length - existingProducts),
      collections: seeds.collections.length,
      types: seeds.types.length,
      tags: seeds.tags.length,
      categories: seeds.categories.length,
      associations: seeds.associations.length,
    },
  })
}
