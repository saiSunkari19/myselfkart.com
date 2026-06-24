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
import { renderStoreEmail } from "../lib/email-template"
import { sendPlatformEmail } from "../lib/store-email"

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

  // Create the tenant registry row up front (as 'draft') so the FK from
  // seller_applications.tenant_id is satisfiable before we stamp it below.
  // provisionTenantStorefrontWith (step 4) re-upserts this row and flips it to
  // 'active', so this is idempotent and safe to re-run on a failed re-approval.
  await knex("tenants")
    .insert({
      id: tenantId,
      name: sellerName,
      slug,
      status: "draft",
      updated_at: knex.fn.now(),
    })
    .onConflict("id")
    .merge({
      name: sellerName,
      slug,
      updated_at: knex.fn.now(),
    })

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
    //    Stamp the tenant's market so the storefront resolves the right region.
    await provisionTenantStorefrontWith(container, {
      tenantId,
      host,
      sellerName,
      slug,
      status: "active",
      currency: application.currency,
      country: application.country,
    })

    await updateApplication(knex, application.id, {
      status: "active",
      provisioning_error: null,
    })

    logger.info(
      `Seller onboarded from application ${application.id}: tenant_id=${tenantId} host=${host}`
    )

    // P-1: email the seller their admin login + portal URL (platform identity).
    // Non-fatal — a mail failure must not fail an otherwise-successful onboarding;
    // the operator still gets the one-time credential in the API response.
    try {
      const adminUrl = `${process.env.MEDUSA_BACKEND_URL ?? ""}/app`
      const storeUrl = `${host.includes("localhost") ? "http" : "https"}://${host}`
      const { html, text } = renderStoreEmail({
        storeName: "Selfkart",
        heading: `Your store "${sellerName}" is ready`,
        intro:
          "Welcome to Selfkart! Your store has been created. Use the credentials below to sign in to your admin dashboard, then change your password.",
        rows: [
          { label: "Admin login", value: application.owner_email },
          { label: "Temporary password", value: tempPassword },
          { label: "Your storefront", value: storeUrl },
        ],
        button: { label: "Open your admin dashboard", url: adminUrl },
        outroHtml: `<p style="margin:16px 0 0;color:#6b7280;font-size:13px;">For your security, change this temporary password after your first sign-in.</p>`,
        footerNote: "Sent by Selfkart.",
      })
      await sendPlatformEmail(container, {
        to: application.owner_email,
        subject: `Your Selfkart store "${sellerName}" is ready`,
        html,
        text,
        template: "seller-onboarding",
        idempotencyKey: `seller-onboarding:${tenantId}`,
      })
    } catch (mailError) {
      logger.error(
        `[seller-onboarding] failed to email credentials for tenant ${tenantId}: ${serializeError(mailError)}`
      )
    }

    return { tenantId, host, adminEmail: application.owner_email, tempPassword }
  } catch (error) {
    const message = serializeError(error)
    await updateApplication(knex, application.id, {
      status: "failed",
      provisioning_error: message,
    })
    logger.error(
      `Provisioning failed for application ${application.id} (tenant ${tenantId}): ${message}`
    )
    if (error instanceof Error && error.stack) {
      logger.error(error.stack)
    }
    throw error
  }
}

/**
 * Extracts a human-readable message from anything that may be thrown. Medusa
 * sometimes rejects with a plain object (e.g. validation/remote-query errors)
 * rather than an Error, which previously stringified to "[object Object]".
 */
function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>
    if (typeof obj.message === "string") {
      return obj.message
    }
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}
