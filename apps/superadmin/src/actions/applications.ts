"use server"

import { revalidatePath } from "next/cache"

import { platformFetch, PlatformApiError } from "@/lib/medusa"

export type ReviewState = {
  ok: boolean
  error: string | null
  /** One-time seller admin credential returned on a successful approve. */
  credential?: { adminEmail: string; tempPassword: string; host: string } | null
}

export async function approveAction(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const id = String(formData.get("id") ?? "")
  if (!id) {
    return { ok: false, error: "Missing application id." }
  }

  try {
    const result = await platformFetch<{
      adminEmail: string
      tempPassword: string
      host: string
    }>(`/selfkart/platform/applications/${id}/approve`, { method: "POST" })
    revalidatePath("/applications")
    revalidatePath("/tenants")
    revalidatePath("/")
    return {
      ok: true,
      error: null,
      credential: {
        adminEmail: result.adminEmail,
        tempPassword: result.tempPassword,
        host: result.host,
      },
    }
  } catch (error) {
    const message =
      error instanceof PlatformApiError ? error.message : "Provisioning failed."
    revalidatePath("/applications")
    return { ok: false, error: message }
  }
}

export async function rejectAction(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const id = String(formData.get("id") ?? "")
  const reason = String(formData.get("reason") ?? "").trim() || null
  if (!id) {
    return { ok: false, error: "Missing application id." }
  }

  try {
    await platformFetch(`/selfkart/platform/applications/${id}/reject`, {
      method: "POST",
      body: { reason },
    })
    revalidatePath("/applications")
    revalidatePath("/")
    return { ok: true, error: null }
  } catch (error) {
    const message =
      error instanceof PlatformApiError ? error.message : "Could not reject."
    return { ok: false, error: message }
  }
}
