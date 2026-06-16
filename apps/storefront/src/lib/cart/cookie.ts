import "server-only"

import { cookies } from "next/headers"

// Host-scoped (each tenant is a distinct domain) and httpOnly, so the cart id is
// never readable by client JS and never shared across tenant domains. The signed
// tenant headers are added server-side, so a stolen cart id from one tenant is
// still useless against another tenant's RLS-scoped backend.
const CART_COOKIE = "_selfkart_cart_id"

export async function getCartId(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value ?? null
}

export async function setCartId(cartId: string): Promise<void> {
  const store = await cookies()
  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearCartId(): Promise<void> {
  const store = await cookies()
  store.delete(CART_COOKIE)
}
