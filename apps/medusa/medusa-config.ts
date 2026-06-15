import { defineConfig, loadEnv } from "@medusajs/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const databaseUrl = process.env.DATABASE_URL || process.env.APP_DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL or APP_DATABASE_URL is required")
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000,http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001,http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:7001,http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "phase0b-jwt-secret-change-before-production",
      cookieSecret:
        process.env.COOKIE_SECRET || "phase0b-cookie-secret-change-before-production",
    },
  },
})
