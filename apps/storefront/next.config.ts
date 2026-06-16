import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"

// Pin the workspace root to this app so Next does not infer a parent directory
// from unrelated lockfiles elsewhere on the machine.
const projectRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: { root: projectRoot },
  // Storefront media is served from tenant-prefixed R2 keys; allow remote images.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // The tenant is derived per-request from the Host header, so storefront pages
  // must never be statically cached across tenants.
  experimental: {},
}

export default nextConfig
