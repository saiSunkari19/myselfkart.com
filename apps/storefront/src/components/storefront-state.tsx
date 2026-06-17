import { getStorefrontStateContent, type StorefrontState } from "../lib/tenant/status-content"

export function StorefrontStatePage({ state }: { state: StorefrontState }) {
  const content = getStorefrontStateContent(state)

  return (
    <main className="storefront-state">
      <p className="storefront-state__eyebrow">{content.eyebrow}</p>
      <h1>{content.title}</h1>
      <p>{content.body}</p>
    </main>
  )
}
