import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { Resend } from "resend"
import type { CreateEmailOptions } from "resend"

type ResendOptions = {
  api_key: string
  /** Fallback From used when a notification doesn't carry its own `from`. */
  from: string
  /** Optional fallback Reply-To. */
  reply_to?: string
}

type InjectedDependencies = {
  logger: Logger
}

/**
 * Multi-tenant Resend notification provider.
 *
 * Medusa ships no official Resend package, so this is the thin
 * `AbstractNotificationProviderService` from Medusa's own Resend guide, adapted
 * for our multi-tenant sender model: the per-notification `from` and `reply_to`
 * are read off each notification (packed by the tenant-safe send helper, F-3) so
 * one registered provider sends every store's mail under
 * `"<Store>" <store+<tenant_id>@mail.myselfkart.com>` with the seller's contact as
 * Reply-To. It falls back to the configured `from` only when a notification
 * supplies none (e.g. platform mail).
 *
 * Content: sends `content.html` / `content.text` directly today. React Email
 * templates (F-4) can be added later via a template registry keyed on
 * `notification.template`; until then `template` is informational only.
 *
 * Registered id: `notification-resend` (see medusa-config.ts). Channel: "email".
 */
class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  protected readonly logger_: Logger
  protected readonly options_: ResendOptions
  protected readonly client_: Resend

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.client_ = new Resend(options.api_key)
  }

  static validateOptions(options: Record<string, unknown>): void {
    if (!options.api_key) {
      throw new Error("Resend notification provider requires the `api_key` option")
    }
    if (!options.from) {
      throw new Error("Resend notification provider requires the `from` option")
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification?.to) {
      this.logger_.error("[resend] notification is missing a `to` address; skipping")
      return {}
    }

    const data = (notification.data ?? {}) as Record<string, any>
    const content = notification.content ?? {}

    // Sender identity: prefer what the send helper packed onto the notification,
    // then the notification.data, then the provider default.
    const from = notification.from || data.from || this.options_.from
    const replyTo = data.reply_to ?? data.replyTo ?? this.options_.reply_to
    const subject = content.subject ?? data.subject ?? ""
    const html = content.html ?? data.html
    const text = content.text ?? data.text

    if (!html && !text) {
      this.logger_.error(
        `[resend] no html/text content for template "${notification.template}" to ${notification.to}; skipping`
      )
      return {}
    }

    const emailOptions = {
      from,
      to: [notification.to],
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      ...(replyTo ? { replyTo } : {}),
      ...(Array.isArray(data.attachments) ? { attachments: data.attachments } : {}),
    } as CreateEmailOptions

    const { data: result, error } = await this.client_.emails.send(emailOptions)

    if (error || !result) {
      this.logger_.error(
        `[resend] failed to send to ${notification.to}: ${error?.message ?? "unknown error"}`
      )
      return {}
    }

    return { id: result.id }
  }
}

export default ResendNotificationProviderService
