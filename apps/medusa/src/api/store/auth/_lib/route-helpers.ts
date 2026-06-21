import type { MedusaRequest } from "@medusajs/framework/http"

/** Build the AuthModule `authData` payload from a request (mirrors Medusa's stock auth routes). */
export function buildAuthData(req: MedusaRequest) {
  return {
    actor_type: "customer",
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    protocol: req.protocol,
  }
}
