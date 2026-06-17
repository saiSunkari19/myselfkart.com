import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import RazorpayProviderService from "./service"

/**
 * Registers the multi-tenant Razorpay provider with Medusa's Payment Module.
 * Registered in medusa-config.ts under `@medusajs/medusa/payment` → providers.
 */
export default ModuleProvider(Modules.PAYMENT, {
  services: [RazorpayProviderService],
})
