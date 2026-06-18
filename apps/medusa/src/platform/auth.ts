import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto"

/**
 * Platform-operator credential + session primitives.
 *
 * Deliberately dependency-free (only node:crypto) so it is trivially
 * unit-testable without a database or a booted Medusa container — see
 * scripts/assert-platform-admin-flow.ts.
 *
 * Passwords: salted scrypt, stored as `scrypt$<saltHex>$<hashHex>`.
 * Sessions:  a 256-bit opaque bearer token handed to the console; only its
 *            SHA-256 hash is stored, so a DB leak does not yield live tokens.
 */

const SCRYPT_KEYLEN = 64
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12h

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN)
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$")
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false
  }
  const [, saltHex, hashHex] = parts
  let salt: Buffer
  let expected: Buffer
  try {
    salt = Buffer.from(saltHex, "hex")
    expected = Buffer.from(hashHex, "hex")
  } catch {
    return false
  }
  if (expected.length === 0) {
    return false
  }
  const derived = scryptSync(password, salt, expected.length)
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

/** A fresh opaque session token (returned to the client, never stored raw). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex")
}

/** Stored form of a session token — only the hash ever touches the DB. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function sessionExpiry(now: number): Date {
  return new Date(now + SESSION_TTL_MS)
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// DNS label: lowercase alnum + hyphen, no leading/trailing hyphen, 2-40 chars.
const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

export function normalizeSubdomain(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
    : ""
}

export function isValidSubdomain(value: string): boolean {
  return SUBDOMAIN_PATTERN.test(value)
}

/**
 * Loose international phone check: we only care that the operator can actually
 * dial it back, so we count digits (ignoring spaces, hyphens, parens and a
 * leading +) and accept anything in the E.164 range of 7-15 digits.
 */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 7 && digits.length <= 15
}

/** Reserved hosts that must never be claimed by a seller subdomain. */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "app",
  "store",
  "shop",
  "mail",
  "static",
  "assets",
  "cdn",
  "selfkart",
])
