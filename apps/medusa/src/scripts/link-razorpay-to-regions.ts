import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import { updateRegionsWorkflow } from "@medusajs/core-flows"

const MANUAL_PAYMENT_PROVIDER_ID = "pp_system_default"
const RAZORPAY_PAYMENT_PROVIDER_ID = "pp_razorpay_razorpay"

/**
 * One-time backfill: links the Razorpay provider to every existing region so it
 * becomes available at checkout (regions are platform-shared by currency).
 * Provisioning new tenants already does this; this covers regions created before
 * the Razorpay provider existed. Idempotent.
 *
 * Run: npx medusa exec ./src/scripts/link-razorpay-to-regions.ts
 */
export default async function linkRazorpayToRegions({
  container,
}: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(
    ContainerRegistrationKeys.QUERY
  ) as Omit<RemoteQueryFunction, symbol>

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code", "payment_providers.id"],
  })

  let updated = 0
  for (const region of regions) {
    const current = new Set<string>(
      (region.payment_providers ?? []).map((p: { id: string }) => p.id)
    )
    current.add(MANUAL_PAYMENT_PROVIDER_ID)
    if (current.has(RAZORPAY_PAYMENT_PROVIDER_ID)) {
      continue
    }
    current.add(RAZORPAY_PAYMENT_PROVIDER_ID)
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: [...current] },
      },
    })
    updated += 1
    logger.info(
      `Linked Razorpay to region ${region.id} (${region.currency_code})`
    )
  }

  logger.info(
    `Razorpay region backfill complete: ${updated}/${regions.length} region(s) updated`
  )
}
