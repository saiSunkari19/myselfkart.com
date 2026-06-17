"use server"

import { revalidatePath } from "next/cache"

import { platformFetch, PlatformApiError } from "@/lib/medusa"

export type HostState = {
  ok: boolean
  error: string | null
  host?: string | null
}

export type StatusState = {
  ok: boolean
  error: string | null
  status?: "active" | "suspended"
}

export type PasswordState = {
  ok: boolean
  error: string | null
  /** The one-time credential to hand to the seller, present only on success. */
  credential?: { email: string; password: string } | null
}

export type RazorpayState = {
  ok: boolean
  error: string | null
  credentials?: {
    provider: "razorpay"
    mode: "test" | "live"
    enabled: boolean
    key_id: string
    key_secret_hint: string
    webhook_secret_hint: string
    ready: boolean
    updated_at: string
  } | null
}

/**
 * Generates (or sets) the seller admin's login password and returns it once so
 * the operator can share it. The seller logs into /admin with this email + password.
 */
export async function resetTenantPasswordAction(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const id = String(formData.get("id") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!id) {
    return { ok: false, error: "Missing tenant id." }
  }

  try {
    const result = await platformFetch<{ email: string; password: string }>(
      `/selfkart/platform/tenants/${id}/admin-password`,
      { method: "POST", body: password ? { password } : {} }
    )
    return {
      ok: true,
      error: null,
      credential: { email: result.email, password: result.password },
    }
  } catch (error) {
    const message =
      error instanceof PlatformApiError ? error.message : "Could not update password."
    return { ok: false, error: message }
  }
}

/**
 * Saves or rotates Razorpay credentials for one tenant. Blank secret fields are
 * preserved by the backend once credentials already exist.
 */
export async function updateTenantRazorpayAction(
  _prev: RazorpayState,
  formData: FormData
): Promise<RazorpayState> {
  const id = String(formData.get("id") ?? "")
  const mode = String(formData.get("mode") ?? "")
  const keyId = String(formData.get("key_id") ?? "").trim()
  const keySecret = String(formData.get("key_secret") ?? "")
  const webhookSecret = String(formData.get("webhook_secret") ?? "")
  const enabled = String(formData.get("enabled") ?? "") === "on"

  if (!id) {
    return { ok: false, error: "Missing tenant id." }
  }
  if (mode !== "test" && mode !== "live") {
    return { ok: false, error: "Choose test or live mode." }
  }
  if (!keyId) {
    return { ok: false, error: "Enter the Razorpay key id." }
  }

  try {
    const result = await platformFetch<{
      credentials: NonNullable<RazorpayState["credentials"]>
    }>(`/selfkart/platform/tenants/${id}/payment-credentials/razorpay`, {
      method: "POST",
      body: {
        mode,
        enabled,
        key_id: keyId,
        key_secret: keySecret,
        webhook_secret: webhookSecret,
      },
    })
    revalidatePath(`/tenants/${id}`)
    return { ok: true, error: null, credentials: result.credentials }
  } catch (error) {
    const message =
      error instanceof PlatformApiError
        ? error.message
        : "Could not update Razorpay credentials."
    return { ok: false, error: message }
  }
}

/**
 * Enables (active) or disables (suspended) a tenant's storefront. A suspended
 * store stops loading for buyers immediately.
 */
export async function updateTenantStatusAction(
  _prev: StatusState,
  formData: FormData
): Promise<StatusState> {
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")

  if (!id) {
    return { ok: false, error: "Missing tenant id." }
  }
  if (status !== "active" && status !== "suspended") {
    return { ok: false, error: "Invalid status." }
  }

  try {
    await platformFetch(`/selfkart/platform/tenants/${id}/status`, {
      method: "POST",
      body: { status },
    })
    revalidatePath(`/tenants/${id}`)
    revalidatePath("/tenants")
    revalidatePath("/")
    return { ok: true, error: null, status }
  } catch (error) {
    const message =
      error instanceof PlatformApiError ? error.message : "Could not update status."
    return { ok: false, error: message }
  }
}

/**
 * Repoints a tenant's primary storefront host. Posts to the platform API, which
 * updates the tenant_domains registry the storefront resolves against.
 */
export async function updateTenantHostAction(
  _prev: HostState,
  formData: FormData
): Promise<HostState> {
  const id = String(formData.get("id") ?? "")
  const host = String(formData.get("host") ?? "")
    .trim()
    .toLowerCase()

  if (!id) {
    return { ok: false, error: "Missing tenant id." }
  }
  if (!host) {
    return { ok: false, error: "Enter a host." }
  }

  try {
    const result = await platformFetch<{ host: string }>(
      `/selfkart/platform/tenants/${id}/domain`,
      { method: "POST", body: { host } }
    )
    revalidatePath(`/tenants/${id}`)
    revalidatePath("/tenants")
    return { ok: true, error: null, host: result.host }
  } catch (error) {
    const message =
      error instanceof PlatformApiError ? error.message : "Could not update host."
    return { ok: false, error: message }
  }
}

export type DeleteState = {
  ok: boolean
  error: string | null
  /** Set when deletion was blocked because the store has real orders. */
  blockedByOrders?: number | null
}

/**
 * HARD-deletes a tenant and all its data. Irreversible. The platform API refuses
 * (409) when the store has real orders; we surface that so the operator can
 * re-submit with `force` to override.
 */
export async function deleteTenantAction(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  const id = String(formData.get("id") ?? "")
  const force = String(formData.get("force") ?? "") === "true"
  if (!id) {
    return { ok: false, error: "Missing tenant id." }
  }

  try {
    await platformFetch(
      `/selfkart/platform/tenants/${id}${force ? "?force=true" : ""}`,
      { method: "DELETE" }
    )
    revalidatePath("/tenants")
    revalidatePath("/")
    return { ok: true, error: null }
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 409) {
      const body = error.body as { orders?: number } | null
      return { ok: false, error: error.message, blockedByOrders: body?.orders ?? null }
    }
    const message =
      error instanceof PlatformApiError ? error.message : "Could not delete store."
    return { ok: false, error: message }
  }
}

export type BulkDeleteState = {
  ok: boolean
  error: string | null
  deleted?: number
  skipped?: number
}

/**
 * Hard-deletes every DISABLED tenant (status 'suspended' or 'draft'). Active
 * stores are never touched. Stores with real orders are skipped (not forced),
 * so order history is never silently destroyed in bulk.
 */
export async function deleteAllDisabledAction(
  _prev: BulkDeleteState,
  _formData: FormData
): Promise<BulkDeleteState> {
  try {
    const { tenants } = await platformFetch<{
      tenants: { id: string; status: string }[]
    }>("/selfkart/platform/tenants")
    const disabled = tenants.filter(
      (t) => t.status === "suspended" || t.status === "draft"
    )

    let deleted = 0
    let skipped = 0
    for (const t of disabled) {
      try {
        await platformFetch(`/selfkart/platform/tenants/${t.id}`, { method: "DELETE" })
        deleted += 1
      } catch {
        // 409 (has orders) or any error: skip, don't force in bulk.
        skipped += 1
      }
    }

    revalidatePath("/tenants")
    revalidatePath("/")
    return { ok: true, error: null, deleted, skipped }
  } catch {
    return { ok: false, error: "Could not load tenants to delete." }
  }
}
