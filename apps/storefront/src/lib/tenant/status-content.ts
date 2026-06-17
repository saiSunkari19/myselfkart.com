import type { TenantStatus } from "./types"

export type StorefrontState = Exclude<TenantStatus, "active"> | "not-found"

type StorefrontStateContent = {
  eyebrow: string
  title: string
  body: string
}

const CONTENT: Record<StorefrontState, StorefrontStateContent> = {
  "not-found": {
    eyebrow: "Store not found",
    title: "We could not find this store.",
    body: "Check the link and try again.",
  },
  draft: {
    eyebrow: "Coming soon",
    title: "This store is getting ready.",
    body: "The catalog is being prepared. Please check back soon.",
  },
  suspended: {
    eyebrow: "Unavailable",
    title: "This store is temporarily unavailable.",
    body: "Please contact the store owner for more information.",
  },
}

export function getStorefrontStateContent(
  state: StorefrontState
): StorefrontStateContent {
  return CONTENT[state]
}
