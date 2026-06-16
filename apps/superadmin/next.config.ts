import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The console is server-rendered and talks to Medusa server-side only.
  reactStrictMode: true,
  // This app has its own lockfile; pin the workspace root so Turbopack doesn't
  // walk up and pick an unrelated lockfile elsewhere on the machine.
  turbopack: { root: __dirname },
}

export default nextConfig
