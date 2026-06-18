import { defineMiddlewares } from "@medusajs/framework/http"

import {
  domainTenantContextMiddleware,
  tenantContextMiddleware,
} from "../modules/tenant-context"
import { platformAuthMiddleware } from "../platform/middleware"

const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

export default defineMiddlewares({
  routes: [
    // /selfkart/platform* is the cross-tenant superadmin surface. It lives
    // OUTSIDE /admin* (which is hard-jailed to a single tenant) and is guarded
    // by an opaque platform session instead. The login route is exempt inside
    // the middleware. These routes operate on non-RLS platform tables only.
    {
      matcher: "/selfkart/platform*",
      middlewares: [platformAuthMiddleware],
    },
    // /admin* tenant is derived from the authenticated seller admin's session
    // (auth_identity.app_metadata.tenant_id, carried in the JWT). The framework
    // authenticate("user") middleware runs first, so req.auth_context is set.
    {
      matcher: "/admin*",
      middlewares: [tenantContextMiddleware],
    },
    // multer parses the multipart upload by reading the request as a stream.
    // The stream's end/finish events fire in the root async context (the socket
    // predates our middleware), so multer's next() escapes the AsyncLocalStorage
    // run started by the global /admin* tenantContextMiddleware — the route then
    // runs with no tenant context and requireTenantContext() throws. Re-run
    // tenantContextMiddleware AFTER multer to re-establish the ALS context from
    // req.auth_context before the handler executes.
    {
      method: ["POST"],
      matcher: "/admin/selfkart/product-imports/prepare",
      middlewares: [upload.single("file"), tenantContextMiddleware],
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
