import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthedRequest } from "../../../../platform/middleware"

/** Returns the authenticated operator — used by the console to gate the UI. */
export async function GET(
  req: PlatformAuthedRequest,
  res: MedusaResponse
): Promise<void> {
  const admin = req.platformAdmin!
  res.json({
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  })
}
