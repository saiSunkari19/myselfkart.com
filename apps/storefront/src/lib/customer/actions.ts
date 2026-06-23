"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getTenantMedusa } from "../medusa/client"
import {
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
  updateCustomerProfile,
  type AddressInput,
} from "../medusa/customer"
import { resolveTenant } from "../tenant/resolve-tenant"
import type { TenantResolution } from "../tenant/types"
import { getCartId } from "../cart/cookie"
import {
  clearCustomerToken,
  getCustomerToken,
  setCustomerToken,
} from "./cookie"

export type AuthFormState = { error?: string; sent?: boolean }

async function activeTenant(): Promise<TenantResolution> {
  const tenant = await resolveTenant()
  if (!tenant || tenant.status !== "active") redirect("/")
  return tenant
}

async function requireCustomerToken(next = "/account"): Promise<string> {
  const token = await getCustomerToken()
  if (!token) redirect(`/login?next=${encodeURIComponent(next)}`)
  return token
}

/** Only allow same-origin relative redirects (prevents open-redirect via ?next=). */
function safeNext(value: FormDataEntryValue | null, fallback = "/account"): string {
  const n = String(value ?? fallback)
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback
}

/** Associate the guest cart cookie with the now-signed-in customer. */
async function associateCart(tenant: TenantResolution, token: string): Promise<void> {
  const cartId = await getCartId()
  if (!cartId) return
  try {
    await getTenantMedusa(tenant, token).client.fetch(`/store/carts/${cartId}/customer`, {
      method: "POST",
    })
  } catch {
    /* best-effort: a missing/foreign cart shouldn't block login */
  }
}

function addressFromForm(formData: FormData): AddressInput {
  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim()
    return v.length > 0 ? v : undefined
  }
  return {
    address_name: str("address_name"),
    first_name: str("first_name"),
    last_name: str("last_name"),
    company: str("company"),
    address_1: str("address_1"),
    address_2: str("address_2"),
    city: str("city"),
    province: str("province"),
    postal_code: str("postal_code"),
    country_code: str("country_code")?.toLowerCase(),
    phone: str("phone"),
  }
}

/* ---------------- Sign in / up ---------------- */

export async function emailLoginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const tenant = await activeTenant()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const next = safeNext(formData.get("next"))
  if (!email || !password) return { error: "Enter your email and password." }

  try {
    const { token } = await getTenantMedusa(tenant).client.fetch<{ token: string }>(
      "/store/auth/customer/emailpass",
      { method: "POST", body: { email, password } }
    )
    await setCustomerToken(token)
    await associateCart(tenant, token)
  } catch {
    return { error: "Invalid email or password." }
  }
  redirect(next)
}

export async function emailRegisterAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const tenant = await activeTenant()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const first_name = String(formData.get("first_name") ?? "").trim()
  const last_name = String(formData.get("last_name") ?? "").trim()
  const next = safeNext(formData.get("next"))
  if (!email || !password) return { error: "Enter your email and a password." }
  if (password.length < 8) return { error: "Use a password of at least 8 characters." }

  try {
    const { token } = await getTenantMedusa(tenant).client.fetch<{ token: string }>(
      "/store/auth/customer/emailpass/register",
      { method: "POST", body: { email, password, first_name, last_name } }
    )
    await setCustomerToken(token)
    await associateCart(tenant, token)
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    return {
      error: /already exists|sign in/i.test(message)
        ? "An account with this email already exists. Please sign in instead."
        : "Could not create your account. Please try again.",
    }
  }
  redirect(next)
}

export async function googleStartAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const tenant = await activeTenant()
  const next = safeNext(formData.get("next"))
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL
  if (!callbackUrl) return { error: "Google sign-in is not configured for this store." }

  const hdrs = await headers()
  // Normalise exactly like resolveHost() (first value, no port, lowercased) so the
  // stashed origin host matches the registry host the broker callback redirects to.
  // An EMPTY origin is the failure that strands a user on the broker host (the
  // callback can't redirect back), so refuse to start rather than send "".
  const originHost = (hdrs.get("x-forwarded-host") || hdrs.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0]
  if (!originHost) return { error: "Could not start Google sign-in. Please try again." }

  // The origin store + destination ride along server-side: Medusa stashes them
  // keyed by the OAuth state (recovered by the broker callback), so the browser
  // never carries them and custom seller domains work the same as subdomains.
  let location = ""
  try {
    const resp = await getTenantMedusa(tenant).client.fetch<{ location?: string }>(
      "/store/auth/customer/google",
      { method: "POST", body: { callback_url: callbackUrl, origin_host: originHost, next } }
    )
    location = resp.location ?? ""
  } catch {
    return { error: "Could not start Google sign-in. Please try again." }
  }
  if (!location) return { error: "Could not start Google sign-in. Please try again." }
  redirect(location)
}

export async function logoutAction(): Promise<void> {
  await clearCustomerToken()
  redirect("/")
}

/* ---------------- Password reset ---------------- */

export async function requestPasswordResetAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const tenant = await activeTenant()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  if (email) {
    try {
      await getTenantMedusa(tenant).client.fetch("/store/auth/customer/emailpass/reset-password", {
        method: "POST",
        body: { email },
      })
    } catch {
      /* swallow — never reveal whether the email exists */
    }
  }
  // Always report success to avoid account enumeration.
  return { sent: true }
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const tenant = await activeTenant()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const token = String(formData.get("token") ?? "")
  if (!token || !password) return { error: "This reset link is incomplete." }
  if (password.length < 8) return { error: "Use a password of at least 8 characters." }

  try {
    // Completing the reset uses Medusa's stock update route with the reset token
    // as the bearer (it updates the global emailpass credential by email).
    await getTenantMedusa(tenant).client.fetch("/auth/customer/emailpass/update", {
      method: "POST",
      body: { email, password },
      headers: { authorization: `Bearer ${token}` },
    })
  } catch {
    return { error: "This reset link is invalid or has expired. Request a new one." }
  }
  redirect("/login?reset=1")
}

/* ---------------- Addresses & profile (require login) ---------------- */

export async function addAddressAction(formData: FormData): Promise<void> {
  const tenant = await activeTenant()
  const token = await requireCustomerToken("/account/addresses")
  await createCustomerAddress(tenant, token, addressFromForm(formData))
  revalidatePath("/account/addresses")
}

export async function updateAddressAction(formData: FormData): Promise<void> {
  const tenant = await activeTenant()
  const token = await requireCustomerToken("/account/addresses")
  const addressId = String(formData.get("address_id") ?? "")
  if (!addressId) return
  await updateCustomerAddress(tenant, token, addressId, addressFromForm(formData))
  revalidatePath("/account/addresses")
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const tenant = await activeTenant()
  const token = await requireCustomerToken("/account/addresses")
  const addressId = String(formData.get("address_id") ?? "")
  if (!addressId) return
  await deleteCustomerAddress(tenant, token, addressId)
  revalidatePath("/account/addresses")
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const tenant = await activeTenant()
  const token = await requireCustomerToken("/account")
  await updateCustomerProfile(tenant, token, {
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
  })
  revalidatePath("/account")
}
