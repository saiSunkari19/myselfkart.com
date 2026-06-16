import "server-only"

import { cookies } from "next/headers"

/**
 * The console keeps the opaque Medusa platform session token in an httpOnly
 * cookie. The browser never sees the token in JS and never calls Medusa
 * directly — only this Next.js server forwards it (see lib/medusa.ts).
 */
const COOKIE_NAME = "sa_session"
const MAX_AGE_SECONDS = 60 * 60 * 12 // mirror the backend session TTL

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
