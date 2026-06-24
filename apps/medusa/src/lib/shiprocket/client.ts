/**
 * Minimal Shiprocket API client (uses global fetch; no axios dep). Endpoints and
 * the adhoc-order shape are taken from the verified live calls + the community
 * plugin reference. Base: https://apiv2.shiprocket.in/v1/external.
 */
const BASE = "https://apiv2.shiprocket.in/v1/external"

/** POST /auth/login — returns a Bearer token valid ~240h (10 days). */
export async function shiprocketLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok || !json?.token) {
    throw new Error(
      `Shiprocket auth failed (${res.status}): ${json?.message ?? "no token returned"}`
    )
  }
  return json.token as string
}

export type ShiprocketPickupLocation = {
  id: number
  pickup_location: string
  is_primary_location?: number
}

export class ShiprocketClient {
  constructor(private readonly token: string) {}

  private async req(path: string, init?: RequestInit): Promise<any> {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.token}`,
        ...(init?.headers ?? {}),
      },
    })
    const text = await res.text()
    const json = text ? JSON.parse(text) : {}
    if (!res.ok) {
      const msg = json?.message ?? `Shiprocket request failed: ${res.status}`
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg))
    }
    return json
  }

  /** POST /orders/create/adhoc — create a custom order; returns shipment_id etc. */
  createAdhocOrder(order: Record<string, unknown>): Promise<any> {
    return this.req("/orders/create/adhoc", { method: "POST", body: JSON.stringify(order) })
  }

  /** GET /settings/company/pickup — the account's pickup locations. */
  async getPickupLocations(): Promise<ShiprocketPickupLocation[]> {
    const json = await this.req("/settings/company/pickup", { method: "GET" })
    return (json?.data?.shipping_address ?? []) as ShiprocketPickupLocation[]
  }
}
