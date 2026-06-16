import { defineConfig, loadEnv } from "@medusajs/utils"

import {
  assertTenantReadPathPatchApplied,
  assertTenantTransactionPatchApplied,
  STOREFRONT_DEFAULT_BAD_SECRET,
} from "./src/modules/tenant-context"

loadEnv(process.env.NODE_ENV || "development", process.cwd())
assertTenantTransactionPatchApplied()
assertTenantReadPathPatchApplied()

const databaseUrl = process.env.DATABASE_URL || process.env.APP_DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL or APP_DATABASE_URL is required")
}

const KNOWN_BAD_JWT = "phase0b-jwt-secret-change-before-production"
const KNOWN_BAD_COOKIE = "phase0b-cookie-secret-change-before-production"

const jwtSecret = process.env.JWT_SECRET || KNOWN_BAD_JWT
const cookieSecret = process.env.COOKIE_SECRET || KNOWN_BAD_COOKIE

if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || jwtSecret === KNOWN_BAD_JWT) {
    throw new Error("JWT_SECRET must be set to a strong secret in production")
  }
  if (!process.env.COOKIE_SECRET || cookieSecret === KNOWN_BAD_COOKIE) {
    throw new Error("COOKIE_SECRET must be set to a strong secret in production")
  }
  // Storefront tenant context is derived from this signed value, so a default
  // secret would let anyone forge cross-tenant /store* access.
  if (
    !process.env.SELFKART_STOREFRONT_SECRET ||
    process.env.SELFKART_STOREFRONT_SECRET === STOREFRONT_DEFAULT_BAD_SECRET
  ) {
    throw new Error(
      "SELFKART_STOREFRONT_SECRET must be set to a strong secret in production"
    )
  }
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000,http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001,http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:7001,http://localhost:9000",
      jwtSecret,
      cookieSecret,
    },
  },
  modules: [
    {
      resolve: "./src/modules/tenant-context",
    },
  ],
})
