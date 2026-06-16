import "server-only"

import { redirect } from "next/navigation"

import { platformFetch, PlatformApiError } from "./medusa"
import type { PlatformAdmin } from "./types"

/** Returns the current operator, or null if there is no valid session. */
export async function getAdmin(): Promise<PlatformAdmin | null> {
  try {
    const { admin } = await platformFetch<{ admin: PlatformAdmin }>(
      "/selfkart/platform/me"
    )
    return admin
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

/** Gate for console pages — redirects to /login when unauthenticated. */
export async function requireAdmin(): Promise<PlatformAdmin> {
  const admin = await getAdmin()
  if (!admin) {
    redirect("/login")
  }
  return admin
}
