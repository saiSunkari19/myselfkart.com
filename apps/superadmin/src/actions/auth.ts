"use server"

import { redirect } from "next/navigation"

import { platformFetch, PlatformApiError } from "@/lib/medusa"
import { clearSessionCookie, getSessionToken, setSessionCookie } from "@/lib/session"

export type LoginState = { error: string | null }

/**
 * Login server action (React 19 useActionState shape). On success it stores the
 * minted token in an httpOnly cookie and redirects into the console.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Enter your email and password." }
  }

  try {
    const { token } = await platformFetch<{ token: string }>(
      "/selfkart/platform/auth/login",
      { method: "POST", authed: false, body: { email, password } }
    )
    await setSessionCookie(token)
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 401) {
      return { error: "Invalid credentials." }
    }
    return { error: "Could not reach the platform. Try again." }
  }

  redirect("/")
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken()
  if (token) {
    await platformFetch("/selfkart/platform/auth/logout", { method: "POST" }).catch(
      () => undefined
    )
  }
  await clearSessionCookie()
  redirect("/login")
}
