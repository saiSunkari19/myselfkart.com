import { defineMiddlewares } from "@medusajs/framework/http"

import { tenantContextMiddleware } from "../modules/tenant-context"

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
    // NOTE: /store* tenant resolution comes from the request DOMAIN, not a
    // session, and is added in Phase 1 (storefront). It is intentionally NOT
    // wired here yet. Postgres RLS still fails closed for any /store* query that
    // runs without tenant context (zero rows), so there is no leak in the gap.
  ],
})
