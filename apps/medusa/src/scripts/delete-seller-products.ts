import type { ExecArgs, RemoteQueryFunction } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"

import { runWithTenantContext } from "../modules/tenant-context"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Input = {
  tenantId: string
  confirmed: boolean
  queryBatchSize: number
  deleteBatchSize: number
}

type ProductRow = {
  id?: string
}

function readPositiveInteger(name: string, defaultValue: number): number {
  const rawValue = process.env[name]

  if (!rawValue) {
    return defaultValue
  }

  const value = Number.parseInt(rawValue, 10)

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }

  return value
}

function readInput(): Input {
  const tenantId = process.env.SELLER_ADMIN_TENANT_ID ?? process.env.TENANT_ID ?? ""

  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("SELLER_ADMIN_TENANT_ID or TENANT_ID must be a valid UUID")
  }

  return {
    tenantId,
    confirmed: process.env.CONFIRM_DELETE_SELLER_PRODUCTS === "yes",
    queryBatchSize: readPositiveInteger("QUERY_BATCH_SIZE", 500),
    deleteBatchSize: readPositiveInteger("DELETE_BATCH_SIZE", 100),
  }
}

async function listTenantProductIds(
  query: Pick<RemoteQueryFunction, "graph">,
  queryBatchSize: number
): Promise<string[]> {
  const productIds: string[] = []
  let skip = 0

  while (true) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id"],
      pagination: {
        skip,
        take: queryBatchSize,
        order: {
          id: "ASC",
        },
      },
    })

    const ids = (data as ProductRow[])
      .map((product) => product.id)
      .filter((id): id is string => !!id)

    productIds.push(...ids)

    if (ids.length < queryBatchSize) {
      break
    }

    skip += queryBatchSize
  }

  return productIds
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export default async function deleteSellerProducts({
  container,
}: ExecArgs): Promise<void> {
  const input = readInput()
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  await runWithTenantContext({ tenantId: input.tenantId, source: "session" }, async () => {
    const productIds = await listTenantProductIds(query, input.queryBatchSize)

    if (!productIds.length) {
      logger.info(`No products found for tenant_id=${input.tenantId}`)
      return
    }

    if (!input.confirmed) {
      logger.warn(
        [
          `Dry run: found ${productIds.length} product(s) for tenant_id=${input.tenantId}.`,
          "Set CONFIRM_DELETE_SELLER_PRODUCTS=yes to delete them.",
        ].join(" ")
      )
      return
    }

    let deletedCount = 0

    for (const productIdBatch of chunk(productIds, input.deleteBatchSize)) {
      await deleteProductsWorkflow(container).run({
        input: {
          ids: productIdBatch,
        },
      })

      deletedCount += productIdBatch.length
      logger.info(
        `Deleted ${deletedCount}/${productIds.length} product(s) for tenant_id=${input.tenantId}`
      )
    }

    logger.info(`Deleted all ${deletedCount} product(s) for tenant_id=${input.tenantId}`)
  })
}
