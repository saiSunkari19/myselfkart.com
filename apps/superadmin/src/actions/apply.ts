"use server"

import { platformFetch, PlatformApiError } from "@/lib/medusa"

export type ApplyState = {
  ok: boolean
  message: string | null
  errors: Record<string, string>
}

// NOTE: a "use server" module may only export async functions, so the initial
// state constant lives in the client component (apply-form.tsx), not here.

/**
 * Public "become a seller" submission. Posts to the unauthenticated Medusa
 * endpoint and maps 422/409 field errors back to the form.
 */
export async function submitApplicationAction(
  _prev: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const payload = {
    store_name: String(formData.get("store_name") ?? ""),
    owner_name: String(formData.get("owner_name") ?? ""),
    owner_email: String(formData.get("owner_email") ?? ""),
    desired_subdomain: String(formData.get("desired_subdomain") ?? ""),
    country: String(formData.get("country") ?? "us"),
    currency: String(formData.get("currency") ?? "usd"),
    phone: String(formData.get("phone") ?? ""),
    selling_on: String(formData.get("selling_on") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  }

  try {
    await platformFetch("/selfkart/applications", {
      method: "POST",
      authed: false,
      body: payload,
    })
    return { ok: true, message: null, errors: {} }
  } catch (error) {
    if (error instanceof PlatformApiError) {
      const body = error.body as { errors?: Record<string, string> } | null
      return {
        ok: false,
        message: error.status >= 500 ? "Something went wrong. Try again." : error.message,
        errors: body?.errors ?? {},
      }
    }
    return { ok: false, message: "Could not submit. Try again.", errors: {} }
  }
}
