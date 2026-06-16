/**
 * Formats a Medusa money amount. Amounts are stored in MAJOR units
 * (e.g. 49.99), so they are passed straight to Intl — never divide by 100.
 */
export function formatMoney(
  amount: number | null | undefined,
  currencyCode: string | null | undefined
): string {
  if (amount == null) {
    return "—"
  }
  const currency = (currencyCode ?? "usd").toUpperCase()
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}
