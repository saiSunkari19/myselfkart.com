import "server-only"

import { cookies } from "next/headers"

/**
 * Customer session token (a Medusa customer JWT, actor bound to this tenant's
 * customer). httpOnly + HOST-ONLY (no cookie domain), so each store — subdomain
 * or fully custom domain — has its own first-party session and one store's cookie
 * is never sent to another. Set directly on email/password login, and on the
 * store's own /auth/google/finish route after the OAuth handoff.
 */
const CUSTOMER_COOKIE = "_selfkart_customer_token"

export async function getCustomerToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(CUSTOMER_COOKIE)?.value ?? null
}

export async function setCustomerToken(token: string): Promise<void> {
  const store = await cookies()
  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // matches the 7d token expiry
  })
}

export async function clearCustomerToken(): Promise<void> {
  const store = await cookies()
  store.set(CUSTOMER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
}
