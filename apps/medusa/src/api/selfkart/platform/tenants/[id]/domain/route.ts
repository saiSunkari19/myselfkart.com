import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  findTenantById,
  HostInUseError,
  updateTenantPrimaryHost,
} from "../../../../../../platform/repository"

// A storefront host: one or more dot-separated labels, letters/digits/hyphens.
// Permits `.localhost` for dev and real apex/subdomains for prod.
const HOST_PATTERN = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/

/**
 * Repoints a tenant's primary storefront host. The storefront resolves tenants
 * by Host (see /selfkart/resolve-domain), so this immediately changes which
 * domain serves the store. The publishable key on the domain row is preserved.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const id = req.params.id

  const tenant = await findTenantById(knex, id)
  if (!tenant) {
    res.status(404).json({ message: "Tenant not found" })
    return
  }

  const raw = (req.body as { host?: unknown })?.host
  const host = typeof raw === "string" ? raw.trim().toLowerCase() : ""

  if (!host || !HOST_PATTERN.test(host)) {
    res.status(422).json({ message: "Enter a valid host, e.g. acme.selfkart.com" })
    return
  }

  try {
    await updateTenantPrimaryHost(knex, id, host)
  } catch (error) {
    if (error instanceof HostInUseError) {
      res.status(409).json({ message: error.message })
      return
    }
    throw error
  }

  res.json({ host })
}
