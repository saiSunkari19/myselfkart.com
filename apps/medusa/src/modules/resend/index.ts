import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import ResendNotificationProviderService from "./service"

/**
 * Registers the multi-tenant Resend provider with Medusa's Notification Module.
 * Registered in medusa-config.ts under `@medusajs/medusa/notification` → providers
 * when RESEND_API_KEY + RESEND_FROM are set.
 */
export default ModuleProvider(Modules.NOTIFICATION, {
  services: [ResendNotificationProviderService],
})
