import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { renderStoreEmail } from "../lib/email-template"
import { sendPlatformEmail } from "../lib/store-email"

type PasswordResetEvent = {
  entity_id: string
  actor_type: string
  token: string
}

/**
 * P-2: seller-admin self-serve password reset. Medusa's stock
 * `/auth/user/emailpass/reset-password` (the "Forgot password?" on the /app login)
 * emits `auth.password_reset` with actor_type "user". This subscriber emails the
 * admin a reset link to Medusa Admin's built-in reset page on the platform host —
 * platform identity (noreply@/connect@), NOT a store identity, because this is
 * Selfkart admin access, not a buyer-facing store email.
 *
 * The customer reset subscriber ignores non-customer actors, so the two never
 * double-send. No tenant context needed: the link targets /app, and the platform
 * sender carries no tenant data.
 */
export default async function adminPasswordResetHandler({
  event,
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  const { entity_id: email, actor_type, token } = event.data
  if (actor_type !== "user") return

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!email || !token) return

  const base = (process.env.MEDUSA_BACKEND_URL ?? "").replace(/\/$/, "")
  if (!base) {
    logger.warn(`[admin-password-reset] MEDUSA_BACKEND_URL not set; cannot build reset link for ${email}`)
    return
  }
  const resetUrl = `${base}/app/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  try {
    const { html, text } = renderStoreEmail({
      storeName: "Selfkart",
      preheader: "Reset your Selfkart seller admin password",
      heading: "Reset your seller admin password",
      intro:
        "We received a request to reset the password for your Selfkart seller admin account. This link expires shortly.",
      button: { label: "Reset your password", url: resetUrl },
      outroHtml: `<p style="margin:16px 0 0;color:#6b7280;font-size:13px;">If the button doesn't work, paste this link into your browser:<br><a href="${resetUrl}" style="color:#6b7280;">${resetUrl}</a></p><p style="margin:12px 0 0;color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>`,
      footerNote: "Sent by Selfkart.",
    })

    await sendPlatformEmail(container, {
      to: email,
      subject: "Reset your Selfkart seller admin password",
      html,
      text,
      template: "admin-password-reset",
      idempotencyKey: `admin-password-reset:${token}`,
    })
    logger.info(`[admin-password-reset] sent reset email to ${email}`)
  } catch (err) {
    logger.error(
      `[admin-password-reset] failed to send reset email to ${email}: ${(err as Error)?.message ?? err}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
