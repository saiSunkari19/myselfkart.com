import { defineMiddlewares } from "@medusajs/framework/http"

import {
  domainTenantContextMiddleware,
  tenantContextMiddleware,
} from "../modules/tenant-context"

const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

export default defineMiddlewares({
  routes: [
    // /admin* tenant is derived from the authenticated seller admin's session
    // (auth_identity.app_metadata.tenant_id, carried in the JWT). The framework
    // authenticate("user") middleware runs first, so req.auth_context is set.
    {
      matcher: "/admin*",
      middlewares: [tenantContextMiddleware],
    },
    {
      method: ["POST"],
      matcher: "/admin/selfkart/product-imports/prepare",
      middlewares: [upload.single("file")],
    },
    // /store* tenant is derived from the request DOMAIN: the Next.js storefront
    // resolves it from Host server-side and sends the tenant_id with an HMAC
    // signature (SELFKART_STOREFRONT_SECRET). The browser cannot forge it, and
    // Postgres RLS still fails closed if context is ever missing.
    {
      matcher: "/store*",
      middlewares: [domainTenantContextMiddleware],
    },
  ],
})
