import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/core-flows"

import { runWithTenantContext } from "../modules/tenant-context"

/**
 * Ensures every variant of a tenant has a price in the tenant's market currency,
 * converting from an existing price (EUR/USD) when the currency is missing —
 * existing prices are preserved. Fixes the "no price on the storefront" symptom
 * when a catalog was imported from a CSV that lacked the store-currency column
 * (e.g. an INR store imported a EUR/USD-only CSV).
 *
 * Idempotent: variants that already have the target currency are left untouched.
 * Env: TENANT_ID (required). CURRENCY optional (defaults to tenants.currency).
 */

// Indicative cross rates via USD. Test/bootstrap values, not live FX.
const PER_USD: Record<string, number> = { usd: 1, eur: 0.92, inr: 83, aed: 3.67 }

function convert(amount: number, from: string, to: string): number {
  const f = PER_USD[from]
  const t = PER_USD[to]
  if (!f || !t) {
    return amount
  }
  return Math.round((amount / f) * t)
}

/**
 * Reusable form: ensures every variant of `tenantId` has a price in the tenant's
 * market currency. Returns the number of variants given a new price. Safe to call
 * from the import-complete route after a catalog lands. If `currency` is omitted,
 * it is read from `tenants.currency`.
 */
export async function backfillTenantCurrencyPrices(
  container: ExecArgs["container"],
  input: { tenantId: string; currency?: string }
): Promise<number> {
  const { tenantId } = input
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
    raw: (sql: string, b?: unknown[]) => Promise<{ rows?: { currency?: string }[] }>
  }

  let currency = (input.currency ?? "").trim().toLowerCase()
  if (!currency) {
    const row = await knex.raw(`select currency from tenants where id = ?`, [tenantId])
    currency = (row.rows?.[0]?.currency ?? "").trim().toLowerCase()
  }
  if (!currency) {
    // No market currency known (e.g. older tenant not re-provisioned): nothing to do.
    logger.warn(`No currency for tenant ${tenantId}; skipping price backfill`)
    return 0
  }

  return runWithTenantContext({ tenantId, source: "session" }, async () => {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "variants.id", "variants.prices.amount", "variants.prices.currency_code"],
    })

    const productInputs: {
      id: string
      variants: { id: string; prices: { amount: number; currency_code: string }[] }[]
    }[] = []
    let added = 0

    for (const p of products) {
      const variants = (p.variants ?? []) as {
        id: string
        prices?: { amount: number; currency_code: string }[]
      }[]
      const variantInputs: {
        id: string
        prices: { amount: number; currency_code: string }[]
      }[] = []

      for (const v of variants) {
        const prices = (v.prices ?? []).map((pr) => ({
          amount: Number(pr.amount),
          currency_code: pr.currency_code.toLowerCase(),
        }))
        if (prices.some((pr) => pr.currency_code === currency)) {
          continue // already priced in the target currency
        }
        const source =
          prices.find((pr) => pr.currency_code === "eur") ??
          prices.find((pr) => pr.currency_code === "usd") ??
          prices[0]
        if (!source) {
          continue // nothing to convert from
        }
        // Pass existing prices + the new one so the update never drops them.
        variantInputs.push({
          id: v.id,
          prices: [
            ...prices,
            { amount: convert(source.amount, source.currency_code, currency), currency_code: currency },
          ],
        })
        added += 1
      }

      if (variantInputs.length) {
        productInputs.push({ id: p.id, variants: variantInputs })
      }
    }

    if (productInputs.length === 0) {
      logger.info(`No variants needed a ${currency.toUpperCase()} price for tenant ${tenantId}`)
      return 0
    }

    await updateProductsWorkflow(container).run({ input: { products: productInputs } })
    logger.info(
      `Added ${currency.toUpperCase()} price to ${added} variant(s) across ${productInputs.length} product(s) for tenant ${tenantId}`
    )
    return added
  })
}

/** CLI entrypoint: TENANT_ID required, CURRENCY optional. */
export default async function backfillTenantCurrencyPricesCli({
  container,
}: ExecArgs): Promise<void> {
  const tenantId = process.env.TENANT_ID ?? ""
  if (!tenantId) {
    throw new Error("TENANT_ID is required")
  }
  await backfillTenantCurrencyPrices(container, {
    tenantId,
    currency: process.env.CURRENCY,
  })
}
