import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { buildAuthData } from "../../../_lib/route-helpers"
import { resolveTenantCustomerToken } from "../../../_lib/resolve-tenant-customer"
import { getTenantContext } from "../../../../../../modules/tenant-context"
import { getStoreConfig } from "../../../../../../platform/repository"
import { renderStoreEmail } from "../../../../../../lib/email-template"
import { sendStoreEmail } from "../../../../../../lib/store-email"

/**
 * C-2: fire a branded welcome email for a brand-new account (best-effort, never
 * blocks signup). emailpass has no built-in verification event, so this is a
 * welcome rather than a verify. Runs under /store* so tenant context is present.
 */
async function sendWelcomeEmail(scope: MedusaRequest["scope"], email: string): Promise<void> {
  try {
    const tenantId = getTenantContext()?.tenantId
    if (!tenantId || !email) return
    const knex = scope.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
    const config = await getStoreConfig(knex, tenantId)
    const domainRow = await knex("tenant_domains")
      .where({ tenant_id: tenantId, is_primary: true })
      .first<{ host: string | null } | undefined>("host")
    const host = domainRow?.host ?? undefined
    const storeName = config?.store_name?.trim() || "Store"
    const { html, text } = renderStoreEmail({
      storeName,
      logoUrl: config?.logo_url,
      primaryColor: config?.primary_color,
      preheader: `Welcome to ${storeName}`,
      heading: `Welcome to ${storeName}`,
      intro: "Your account is ready. You can now check out faster and track your orders.",
      button: host
        ? { label: "Start shopping", url: `${host.includes("localhost") ? "http" : "https"}://${host}` }
        : undefined,
      supportEmail: config?.contact_email,
      footerNote: `Sent by ${storeName} via Selfkart.`,
    })
    await sendStoreEmail(scope, {
      tenantId,
      to: email,
      subject: `Welcome to ${storeName}`,
      html,
      text,
      template: "customer-welcome",
      idempotencyKey: `welcome:${tenantId}:${email}`,
    })
  } catch {
    // best-effort; never break signup
  }
}

/**
 * POST /store/auth/customer/emailpass/register — create an email/password account.
 *
 * emailpass identities are GLOBAL (one per email across all stores). If the email
 * is new, we register the credential; if it already exists globally, we fall back
 * to authenticating with the supplied password (so a buyer who signed up on another
 * store can use the same email here). Either way we then resolve/create THIS
 * tenant's customer and mint its token. Body: { email, password, first_name?, last_name? }.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const authService: any = req.scope.resolve(Modules.AUTH)
  const body = (req.body ?? {}) as Record<string, unknown>

  const registration = await authService.register("emailpass", { body })
  let authIdentity = registration.authIdentity
  const isNewAccount = Boolean(registration.success && authIdentity)

  if (!registration.success || !authIdentity) {
    // Already registered globally → try to authenticate with the same password.
    const auth = await authService.authenticate("emailpass", buildAuthData(req))
    if (!auth.success || !auth.authIdentity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "An account with this email already exists. Please sign in instead."
      )
    }
    authIdentity = auth.authIdentity
  }

  const token = await resolveTenantCustomerToken(req.scope, authIdentity, "emailpass")

  if (isNewAccount) {
    const email = typeof body.email === "string" ? body.email : ""
    // Fire-and-forget: don't delay the signup response on the welcome email.
    void sendWelcomeEmail(req.scope, email)
  }

  res.json({ token })
}
