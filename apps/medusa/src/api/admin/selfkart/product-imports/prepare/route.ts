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

  await knex.transaction(async (trx) => {
    await trx.raw("select set_config('app.current_tenant', ?, true)", [tenantId])
    await upsertSellerImportTaxonomy(trx, tenantId, seeds)
  })

  res.status(200).json({
    medusa_csv: toCsv(medusaRows),
    summary: {
      rows: rows.length,
      collections: seeds.collections.length,
      types: seeds.types.length,
      tags: seeds.tags.length,
      categories: seeds.categories.length,
      associations: seeds.associations.length,
    },
  })
}
