import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import {
  isValidEmail,
  isValidPhone,
  isValidSubdomain,
  newId,
  normalizeEmail,
  normalizeSubdomain,
  RESERVED_SUBDOMAINS,
} from "../../../platform/auth"
import { insertApplication, type SellingOn } from "../../../platform/repository"
import { renderStoreEmail } from "../../../lib/email-template"
import { sendPlatformEmail } from "../../../lib/store-email"

const SELLING_ON_VALUES: ReadonlySet<SellingOn> = new Set<SellingOn>([
  "instagram_whatsapp",
  "flipkart_amazon",
  "offline_retail",
  "other",
])

/**
 * Public "become a seller" funnel. Lives OUTSIDE /selfkart/platform* so it needs
 * no operator session — it is the form the landing page (selfkart.com) posts to.
 * It only writes a `pending` seller_applications row; no tenant resources are
 * created until an operator approves it in the console.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>

  const storeName = typeof body.store_name === "string" ? body.store_name.trim() : ""
  const ownerName = typeof body.owner_name === "string" ? body.owner_name.trim() : ""
  const ownerEmail = normalizeEmail(body.owner_email)
  const desiredSubdomain = normalizeSubdomain(body.desired_subdomain)
  const country = (typeof body.country === "string" ? body.country : "us").trim().toLowerCase()
  const currency = (typeof body.currency === "string" ? body.currency : "usd").trim().toLowerCase()
  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : ""
  const phone = phoneRaw || null
  const sellingOnRaw = typeof body.selling_on === "string" ? body.selling_on.trim() : ""
  const sellingOn = SELLING_ON_VALUES.has(sellingOnRaw as SellingOn)
    ? (sellingOnRaw as SellingOn)
    : null
  const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null

  const errors: Record<string, string> = {}
  if (storeName.length < 2) errors.store_name = "Store name is required"
  if (ownerName.length < 2) errors.owner_name = "Your name is required"
  if (!isValidEmail(ownerEmail)) errors.owner_email = "A valid email is required"
  if (!phoneRaw) errors.phone = "A phone number is required"
  else if (!isValidPhone(phoneRaw)) errors.phone = "Enter a valid phone number"
  if (!isValidSubdomain(desiredSubdomain)) {
    errors.desired_subdomain =
      "Subdomain must be 2-40 chars: lowercase letters, numbers, hyphens"
  } else if (RESERVED_SUBDOMAINS.has(desiredSubdomain)) {
    errors.desired_subdomain = "That subdomain is reserved"
  }
  if (country.length !== 2) errors.country = "Country must be a 2-letter ISO code"
  if (currency.length !== 3) errors.currency = "Currency must be a 3-letter ISO code"
  if (!sellingOn) errors.selling_on = "Tell us where you sell today"

  if (Object.keys(errors).length > 0) {
    res.status(422).json({ message: "Validation failed", errors })
    return
  }

  const knex = req.scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)

  // An email maps to exactly one seller admin: a single global emailpass identity
  // bound to one tenant (auth tables are intentionally NOT tenant-RLS'd). So the
  // same email cannot open a second store. Reject it here with a clear field
  // error instead of letting provisioning later crash on the global
  // `IDX_user_email_unique` constraint. We block both an email that already has
  // an account and one with another live application in flight.
  const [existingIdentity, existingApplication] = await Promise.all([
    knex("provider_identity")
      .where({ provider: "emailpass", entity_id: ownerEmail })
      .first("id"),
    knex("seller_applications")
      .whereRaw("lower(owner_email) = ?", [ownerEmail])
      .whereIn("status", ["pending", "provisioning", "active"])
      .first("id"),
  ])
  if (existingIdentity || existingApplication) {
    res.status(409).json({
      message: "Validation failed",
      errors: {
        owner_email:
          "This email is already in use. Each store needs its own email address.",
      },
    })
    return
  }

  const id = newId("sapp")

  try {
    await insertApplication(knex, {
      id,
      storeName,
      ownerName,
      ownerEmail,
      desiredSubdomain,
      country,
      currency,
      phone,
      sellingOn,
      notes,
    })
  } catch (error) {
    // The partial unique index rejects a second live application for the same
    // subdomain — surface it as a friendly field error rather than a 500.
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("IDX_seller_applications_subdomain_live")) {
      res.status(409).json({
        message: "Validation failed",
        errors: { desired_subdomain: "That subdomain is already requested or taken" },
      })
      return
    }
    throw error
  }

  // P-3: notify ops of the new application (platform identity). Non-fatal — a mail
  // failure must not fail the public funnel; the application row is already saved.
  try {
    const opsTo =
      process.env.SELFKART_ENQUIRY_TO || process.env.RESEND_REPLY_TO || "connect@myselfkart.com"
    const { html, text } = renderStoreEmail({
      storeName: "Selfkart",
      heading: "New seller application",
      intro: `${ownerName} wants to open "${storeName}" on Selfkart.`,
      rows: [
        { label: "Store", value: storeName },
        { label: "Owner", value: ownerName },
        { label: "Email", value: ownerEmail },
        { label: "Phone", value: phone ?? "—" },
        { label: "Subdomain", value: `${desiredSubdomain}.myselfkart.com` },
        { label: "Market", value: `${country.toUpperCase()} / ${currency.toUpperCase()}` },
        { label: "Selling on", value: sellingOn ?? "—" },
      ],
      outroHtml: notes
        ? `<p style="margin:16px 0 0;color:#374151;font-size:14px;"><strong>Notes:</strong> ${notes}</p>`
        : undefined,
      footerNote: "Review and approve in the Selfkart superadmin console.",
    })
    await sendPlatformEmail(req.scope, {
      to: opsTo,
      subject: `New seller application: ${storeName}`,
      html,
      text,
      template: "seller-application-enquiry",
      idempotencyKey: `enquiry:${id}`,
      data: { reply_to: ownerEmail },
    })
  } catch {
    // swallow — the funnel response below is the source of truth
  }

  res.status(201).json({ id, status: "pending" })
}
