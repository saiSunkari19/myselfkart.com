/**
 * Builds the public URL for a tenant storefront host. Local dev hosts
 * (`*.localhost`) run on the Next dev server at :3000 over http; real domains
 * are served over https with no port. Avoids the hardcoded `http://host:3000`
 * that broke production store links.
 */
export function storefrontUrl(host: string): string {
  const isLocal = host === "localhost" || host.endsWith(".localhost")
  return isLocal ? `http://${host}:3000` : `https://${host}`
}

export function formatDate(value: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
