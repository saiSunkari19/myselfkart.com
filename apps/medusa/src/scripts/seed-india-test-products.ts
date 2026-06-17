import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/core-flows"

import { runWithTenantContext } from "../modules/tenant-context"
import { tenantSalesChannelId } from "./seed-tenant-inventory-resources"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * One-off: seeds two priced, published products for a tenant so its storefront
 * checkout can be exercised end to end. Runs inside the tenant context, so the
 * RLS trigger stamps `tenant_id` on every write and the `productVariantsCreated`
 * hook auto-stocks the new variants at the tenant's stock location.
 */
export default async function seedIndiaTestProducts({ container }: ExecArgs) {
  const tenantId = process.env.TENANT_ID ?? ""
  const currency = (process.env.SELFKART_CURRENCY ?? "inr").toLowerCase()

  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("TENANT_ID must be a valid UUID")
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannelId = tenantSalesChannelId(tenantId)

  await runWithTenantContext({ tenantId, source: "session" }, async () => {
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "India Test Tee",
            status: "published",
            sales_channels: [{ id: salesChannelId }],
            options: [{ title: "Size", values: ["M", "L"] }],
            variants: [
              {
                title: "M",
                options: { Size: "M" },
                manage_inventory: true,
                prices: [{ amount: 499, currency_code: currency }],
              },
              {
                title: "L",
                options: { Size: "L" },
                manage_inventory: true,
                prices: [{ amount: 549, currency_code: currency }],
              },
            ],
          },
          {
            title: "India Test Mug",
            status: "published",
            sales_channels: [{ id: salesChannelId }],
            options: [{ title: "Size", values: ["One Size"] }],
            variants: [
              {
                title: "One Size",
                options: { Size: "One Size" },
                manage_inventory: true,
                prices: [{ amount: 299, currency_code: currency }],
              },
            ],
          },
        ],
      },
    })

    logger.info(
      `Seeded ${result.length} test product(s) for tenant ${tenantId} (${currency})`
    )
  })
}
