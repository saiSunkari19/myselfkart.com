/**
 * Supported selling markets for the Selfkart platform.
 *
 * A market is the seller-facing choice on /apply; it maps to exactly one
 * currency, and a currency maps to exactly one shared Medusa region (Medusa
 * enforces one-country -> one-region, so regions are platform-shared per
 * currency, not per tenant). `countries` is the full set the region + its
 * shipping service zone cover — for Europe the buyer picks any of them at
 * checkout.
 *
 * This is the AUTHORITATIVE source: provisioning derives the region's countries
 * and the shipping geo-zones from here by currency, so adding a country to a
 * market only needs an edit here + a re-provision. The superadmin /apply form
 * keeps a small parallel list for its dropdown (label + currency + primary
 * country); the country *set* is never trusted from the client.
 */
export type MarketKey = "india" | "us" | "uae" | "europe"

export type Market = {
  key: MarketKey
  label: string
  /** ISO 4217, lowercase. One region per currency. */
  currency: string
  /** Primary ISO 3166-1 alpha-2 stored on the application/tenant for display. */
  primaryCountry: string
  /** Every country the region + shipping zone serve (lowercase alpha-2). */
  countries: string[]
}

export const MARKETS: Record<MarketKey, Market> = {
  india: {
    key: "india",
    label: "India",
    currency: "inr",
    primaryCountry: "in",
    countries: ["in"],
  },
  us: {
    key: "us",
    label: "United States",
    currency: "usd",
    primaryCountry: "us",
    countries: ["us"],
  },
  uae: {
    key: "uae",
    label: "United Arab Emirates",
    currency: "aed",
    primaryCountry: "ae",
    countries: ["ae"],
  },
  europe: {
    key: "europe",
    label: "Europe",
    currency: "eur",
    primaryCountry: "de",
    // Core EU set.
    countries: ["de", "fr", "it", "es", "nl", "ie", "be", "at", "pt"],
  },
}

/** The market used when a seller doesn't pick one on /apply. */
export const DEFAULT_MARKET: MarketKey = "india"

export function marketByCurrency(currency: string): Market | undefined {
  const c = currency.trim().toLowerCase()
  return Object.values(MARKETS).find((m) => m.currency === c)
}

/**
 * The countries a currency's region should serve. Falls back to `[fallback]`
 * for an unknown currency so a custom market still provisions a usable region.
 */
export function countriesForCurrency(currency: string, fallback: string): string[] {
  const market = marketByCurrency(currency)
  if (market && market.countries.length > 0) {
    return market.countries
  }
  const norm = fallback.trim().toLowerCase()
  return norm ? [norm] : []
}
