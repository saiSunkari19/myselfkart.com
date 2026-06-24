import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  findApplicationByTenantId,
  findTenantById,
  getTenantOperationalSummary,
  getTenantPaymentCredentialSummary,
  getTenantShiprocketCredentialSummary,
  listTenantDomains,
  teardownTenant,
  TenantHasOrdersError,
} from "../../../../../platform/repository"

/**
 * One tenant's full detail for the superadmin console: the tenant row, all of
 * its mapped domains, the seller application it was provisioned from (owner
 * contact), and live catalog/commerce stats.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const id = req.params.id

  const tenant = await findTenantById(knex, id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }

  const [domains, summary, application, paymentCredentials, shiprocketCredentials] =
    await Promise.all([
      listTenantDomains(knex, id),
      getTenantOperationalSummary(knex, id),
      findApplicationByTenantId(knex, id),
      getTenantPaymentCredentialSummary(knex, id, "razorpay"),
      getTenantShiprocketCredentialSummary(knex, id),
    ])

  res.json({
    tenant,
    domains,
    stats: summary.stats,
    // The seller's login email: prefer the real admin account, fall back to the
    // application's owner email.
    admin_email: summary.adminEmail ?? application?.owner_email ?? null,
    payment_credentials: {
      razorpay: paymentCredentials,
    },
    shiprocket_credentials: shiprocketCredentials,
    owner: application
      ? {
          name: application.owner_name,
          email: application.owner_email,
          phone: application.phone,
          applied_at: application.created_at,
        }
      : null,
  })
}

/**
 * HARD-deletes a tenant and all of its data (catalog, commerce, channel,
 * location, shipping, api key, seller admin + auth, domains, application).
 * Irreversible. Refuses (409) if the tenant has real orders unless `?force=true`.
 * The shared region/countries are intentionally preserved.
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const id = req.params.id

  const tenant = await findTenantById(knex, id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }

  const force = req.query.force === "true" || req.query.force === "1"

  try {
    const result = await teardownTenant(knex, id, { force })
    res.json({ id, deleted: true, ...result })
  } catch (error) {
    if (error instanceof TenantHasOrdersError) {
      res.status(409).json({
        message: `This store has ${error.orders} order(s). Deleting is blocked to protect order history — confirm with force to delete anyway.`,
        orders: error.orders,
      })
      return
    }
    throw error
  }
}
