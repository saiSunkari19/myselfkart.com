import { randomBytes, randomUUID } from "node:crypto"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { provisionSellerAdmin } from "../scripts/create-seller-admin"
import { provisionTenantCommerceWith } from "../scripts/provision-tenant-commerce"
import { provisionTenantStorefrontWith } from "../scripts/provision-tenant-storefront"
import { ensureTenantInventoryResources } from "../scripts/seed-tenant-inventory-resources"
import { hostForSubdomain, updateApplication } from "./repository"
import type { SellerApplication } from "./repository"

export type ProvisionResult = {
  tenantId: string
  host: string
  adminEmail: string
  tempPassword: string
}

/** A throwaway strong password for the seller's first admin login. */
function generateTempPassword(): string {
  // base64url, ~24 chars, mixed entropy — exceeds the 8-char minimum the
  // seller-admin creator enforces.
  return randomBytes(18).toString("base64url")
}

/**
 * Onboards one approved seller end to end — the in-process equivalent of runbook
 * steps 1, 3, 4, 5 (create-seller-admin -> seed-inventory-resources ->
 * provision:commerce -> provision:storefront), minus the catalog steps (the
 * seller imports products later via /app/seller-import).
 *
 * Every underlying step is idempotent and self-healing, so a failed/partial run
 * can be retried by re-approving. The store is provisioned EMPTY but renderable:
 * the tenant's sales channel + stock location + region + shipping + publishable
 * key + domain row all exist, so the storefront resolves and shows "no products
 * yet" until the seller imports a catalog.
 *
 * Mutates the seller_applications row through its lifecycle
 * (provisioning -> active | failed) and returns the one-time admin credential
 * the operator hands to the seller.
 */
export async function provisionSellerFromApplication(
  container: ExecArgs["container"],
  application: SellerApplication,
  reviewedBy: string
): Promise<ProvisionResult> {
  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const tenantId = application.tenant_id ?? randomUUID()
  const host = hostForSubdomain(application.desired_subdomain)
  const sellerName = application.store_name
  // The subdomain is unique among live applications, so it is a safe, collision-
  // free tenant slug (tenants.slug is uniquely indexed).
  const slug = application.desired_subdomain
  const tempPassword = generateTempPassword()

  await updateApplication(knex, application.id, {
    status: "provisioning",
    tenant_id: tenantId,
    host,
    provisioning_error: null,
    reviewed_by: reviewedBy,
    reviewed_at: new Date(),
  })

  try {
    // 1. Tenant admin login (tenant id is allocated here via app_metadata).
    await provisionSellerAdmin(container, {
      tenantId,
      email: application.owner_email,
      password: tempPassword,
    })

    // 2. Sales channel + stock location (+ links). Product/inventory steps are
    //    no-ops with an empty catalog; re-run by the import flow once products land.
    await ensureTenantInventoryResources(knex, {
      tenantId,
      sellerName,
      stockedQuantity: 100,
    })

    // 3. Checkout pipeline: shared region + per-tenant shipping/fulfillment.
    //    No bootstrap pricing — the seller sets real prices via import/admin.
    await provisionTenantCommerceWith(container, {
      tenantId,
      currency: application.currency,
      country: application.country,
      shippingAmount: 0,
      priceAmount: null,
    })

    // 4. Storefront: publishable key + key<->channel link + tenants/tenant_domains.
    await provisionTenantStorefrontWith(container, {
      tenantId,
      host,
      sellerName,
      slug,
      status: "active",
    })

    await updateApplication(knex, application.id, {
      status: "active",
      provisioning_error: null,
    })

    logger.info(
      `Seller onboarded from application ${application.id}: tenant_id=${tenantId} host=${host}`
    )

    return { tenantId, host, adminEmail: application.owner_email, tempPassword }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await updateApplication(knex, application.id, {
      status: "failed",
      provisioning_error: message,
    })
    logger.error(
      `Provisioning failed for application ${application.id} (tenant ${tenantId}): ${message}`
    )
    throw error
  }
}
