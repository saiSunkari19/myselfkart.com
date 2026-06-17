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
const r2Config = {
  fileUrl: process.env.R2_FILE_URL || process.env.S3_FILE_URL,
  accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.R2_REGION || process.env.S3_REGION || "auto",
  bucket: process.env.R2_BUCKET || process.env.S3_BUCKET,
  endpoint: process.env.R2_ENDPOINT || process.env.S3_ENDPOINT,
}
const r2ConfigValues = [
  r2Config.fileUrl,
  r2Config.accessKeyId,
  r2Config.secretAccessKey,
  r2Config.bucket,
  r2Config.endpoint,
]
const hasR2Config = r2ConfigValues.every(Boolean)
const hasPartialR2Config = r2ConfigValues.some(Boolean) && !hasR2Config

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

if (hasPartialR2Config) {
  throw new Error(
    "R2 media config is incomplete. Set R2_FILE_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_ENDPOINT."
  )
}

const modules: any[] = [
  {
    resolve: "./src/modules/tenant-context",
  },
  {
    // Payment Module with the built-in manual provider plus our multi-tenant
    // Razorpay provider. Razorpay holds no keys here — each operation resolves
    // the current tenant's encrypted credentials at runtime (see
    // src/modules/razorpay-payment). Registered id: pp_razorpay_razorpay.
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "./src/modules/razorpay-payment",
          id: "razorpay",
        },
      ],
    },
  },
]

if (hasR2Config) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "./src/modules/tenant-media",
          id: "r2",
          options: {
            file_url: r2Config.fileUrl,
            access_key_id: r2Config.accessKeyId,
            secret_access_key: r2Config.secretAccessKey,
            region: r2Config.region,
            bucket: r2Config.bucket,
            endpoint: r2Config.endpoint,
          },
        },
      ],
    },
  })
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
  modules,
})
