import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Knex } from "knex"

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

  let notificationService: any = null
  try {
    notificationService = container.resolve(Modules.NOTIFICATION)
  } catch {
    notificationService = null
  }

  if (!notificationService) {
    logger.warn(`[password-reset] no notification provider configured. Reset URL for ${email}: ${resetUrl}`)
    return
  }

  try {
    await notificationService.createNotifications({
      to: email,
      channel: "email",
      // A SendGrid dynamic-template id; the reset URL is passed as template data.
      template: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE ?? "password-reset",
      content: {
        subject: "Reset your password",
        text: `Reset your password using this link: ${resetUrl}`,
        html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If the button doesn't work, paste this URL into your browser:<br>${resetUrl}</p><p>If you didn't request this, you can ignore this email.</p>`,
      },
      data: { reset_url: resetUrl, email },
    })
    logger.info(`[password-reset] sent reset email to ${email} for tenant ${tenantId}`)
  } catch (err) {
    logger.error(`[password-reset] failed to send reset email to ${email}: ${(err as Error)?.message ?? err}`)
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
