import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Knex } from "knex"

import { getStoreConfig } from "../platform/repository"
import { renderStoreEmail } from "../lib/email-template"
import { sendStoreEmail } from "../lib/store-email"

type PasswordResetEvent = {
  entity_id: string
  actor_type: string
  token: string
  metadata?: Record<string, any> | null
}

/**
 * Sends the customer password-reset email with a tenant-correct, SERVER-DERIVED
 * reset URL.
 *
 * The reset request (src/api/store/auth/customer/emailpass/reset-password) puts
 * the originating `tenant_id` in the event metadata. Here we look up that tenant's
 * primary storefront host from `tenant_domains` and build
 * `https://<host>/reset-password?token=...&email=...`. The URL is never taken from
 * the client, so it can't be turned into a phishing link.
 *
 * Email delivery needs a Notification provider (SendGrid) configured in
 * medusa-config.ts. Without one, we log the reset URL (usable in dev) and return.
 */
export default async function customerPasswordResetHandler({
  event,
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  const { entity_id: email, actor_type, token, metadata } = event.data
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (actor_type !== "customer") return

  const tenantId = metadata?.tenant_id
  if (!tenantId) {
    logger.warn("[password-reset] event has no tenant_id metadata; skipping email")
    return
  }

  const knex = container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
  const row = await knex("tenant_domains")
    .where({ tenant_id: tenantId, is_primary: true })
    .first("host")
  const host = row?.host as string | undefined
  if (!host) {
    logger.warn(`[password-reset] no primary host for tenant ${tenantId}; skipping email`)
    return
  }

  const protocol = host.includes("localhost") ? "http" : "https"
  const resetUrl = `${protocol}://${host}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  try {
    const config = await getStoreConfig(knex, tenantId)
    const storeName = config?.store_name?.trim() || "Store"
    const { html, text } = renderStoreEmail({
      storeName,
      logoUrl: config?.logo_url,
      primaryColor: config?.primary_color,
      preheader: `Reset your ${storeName} password`,
      heading: "Reset your password",
      intro: `We received a request to reset the password for your ${storeName} account. This link expires shortly.`,
      button: { label: "Reset your password", url: resetUrl },
      outroHtml: `<p style="margin:16px 0 0;color:#6b7280;font-size:13px;">If the button doesn't work, paste this link into your browser:<br><a href="${resetUrl}" style="color:#6b7280;">${resetUrl}</a></p><p style="margin:12px 0 0;color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>`,
      supportEmail: config?.contact_email,
      footerNote: `Sent by ${storeName} via Selfkart.`,
    })

    await sendStoreEmail(container, {
      tenantId,
      to: email,
      subject: `Reset your ${storeName} password`,
      html,
      text,
      template: "customer-password-reset",
      idempotencyKey: `password-reset:${tenantId}:${token}`,
      data: { reset_url: resetUrl },
    })
    logger.info(`[password-reset] sent reset email to ${email} for tenant ${tenantId}`)
  } catch (err) {
    logger.error(`[password-reset] failed to send reset email to ${email}: ${(err as Error)?.message ?? err}`)
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
