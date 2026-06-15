import { defineMiddlewares } from "@medusajs/framework/http"

import { tenantContextMiddleware } from "../modules/tenant-context"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store*",
      middlewares: [tenantContextMiddleware],
    },
    {
      matcher: "/admin*",
      middlewares: [tenantContextMiddleware],
    },
  ],
})
