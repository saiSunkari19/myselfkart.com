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

const allowedWorkerModes = ["shared", "server", "worker"] as const
type WorkerMode = (typeof allowedWorkerModes)[number]
const rawWorkerMode = process.env.MEDUSA_WORKER_MODE || "shared"

if (!allowedWorkerModes.includes(rawWorkerMode as WorkerMode)) {
  throw new Error("MEDUSA_WORKER_MODE must be one of: shared, server, worker")
}

const workerMode = rawWorkerMode as WorkerMode

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
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL must be set in production")
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

// Client-side connection tuning. The DB is remote (Neon, ap-southeast-1) behind
// PgBouncer (sslmode=require&pgbouncer=true), so each request's RLS reads pay the
// Singapore round-trip. Holding a pool of warm, keep-alive sockets avoids paying a
// fresh TCP+TLS handshake (~2 extra round trips) per request. Only client-side knex
// pool + socket options are set here — no Postgres startup params, which PgBouncer
// in transaction mode would reject. SSL stays driven by the URL.
// Neon requires TLS. Force SSL for any non-local host so the connection works even
// when the DATABASE_URL env var is missing `?sslmode=require` (e.g. set without the
// query string in the Render dashboard). Equivalent to sslmode=require — no CA
// verification — which matches the connection strings we already use. PgBouncer is
// fine with client TLS (it's a transport option, not a Postgres startup param).
const isLocalDatabase = /@(localhost|127\.0\.0\.1)/.test(databaseUrl)
const databaseDriverOptions: any = {
  connection: {
    keepAlive: true,
    ...(isLocalDatabase ? {} : { ssl: { rejectUnauthorized: false } }),
  },
  pool: {
    min: Number(process.env.DB_POOL_MIN) || 4,
    max: Number(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS) || 60000,
  },
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl,
    databaseDriverOptions,
    redisUrl: process.env.REDIS_URL,
    workerMode,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000,http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001,http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:7001,http://localhost:9000",
      jwtSecret,
      cookieSecret,
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules,
})
