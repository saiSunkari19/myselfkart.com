import { toHandle } from "@medusajs/framework/utils"

export type CsvRow = Record<string, string>

const RAW_ID_COLUMNS = [
  "Shipping Profile Id",
  "Product Collection Id",
  "Product Type Id",
]

const ASSOCIATION_ONLY_COLUMNS = [
  "Product Collection Title",
  "Product Type Value",
  "Parent Category Id",
  "Parent Category Name",
  "Parent Category Handle",
  "Category Id",
  "Category Name",
  "Category Handle",
]

function isRawReferenceColumn(header: string): boolean {
  return (
    RAW_ID_COLUMNS.includes(header) ||
    /^Product Tag \d+$/.test(header) ||
    /^Product Sales Channel \d+$/.test(header)
  )
}

function isAssociationOnlyColumn(header: string): boolean {
  return ASSOCIATION_ONLY_COLUMNS.includes(header)
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

export function parseCsv(csv: string): CsvRow[] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ""
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const next = csv[index + 1]

    if (quoted) {
      if (char === "\"" && next === "\"") {
        value += "\""
        index += 1
      } else if (char === "\"") {
        quoted = false
      } else {
        value += char
      }
      continue
    }

    if (char === "\"") {
      quoted = true
    } else if (char === ",") {
      row.push(value)
      value = ""
    } else if (char === "\n") {
      row.push(value)
      rows.push(row)
      row = []
      value = ""
    } else if (char !== "\r") {
      value += char
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  const headers = rows.shift()?.map((header) => header.trim()) ?? []

  return rows
    .filter((values) => values.some((cell) => cell.trim().length > 0))
    .map((values) => {
      return headers.reduce<CsvRow>((record, header, index) => {
        record[header] = values[index]?.trim() ?? ""
        return record
      }, {})
    })
}

/**
 * Medusa rejects product handles that aren't URL-safe (isValidHandle checks
 * /^[a-z0-9]+(?:-[a-z0-9]+)*$/). Seller CSVs carry handles straight from their
 * catalog — e.g. "women's-heels" (apostrophe) — so normalise to Medusa's own
 * slug rules (`toHandle`) and trim stray leading/trailing hyphens. Returns ""
 * when nothing usable remains, which lets Medusa auto-generate from the title.
 *
 * MUST be applied consistently to the import CSV (the handle the product is
 * created with) AND to extractSellerImportSeeds' productHandle (the key the
 * post-import taxonomy linking looks the product up by) or the link silently
 * misses. It is idempotent, so running it on either the original or prepared
 * CSV yields the same handle.
 */
export function toUrlSafeHandle(value: string): string {
  return toHandle(value ?? "").replace(/^-+|-+$/g, "")
}

export function toMedusaImportRows(rows: CsvRow[]): CsvRow[] {
  return rows.map((row) => {
    return Object.entries(row).reduce<CsvRow>((safeRow, [header, value]) => {
      if (isAssociationOnlyColumn(header) || isRawReferenceColumn(header)) {
        return safeRow
      }

      safeRow[header] =
        header === "Product Handle" ? toUrlSafeHandle(value) : value
      return safeRow
    }, {})
  })
}

export function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) {
    return ""
  }

  const headers = Object.keys(rows[0] ?? {})
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => {
      return headers.map((header) => escapeCsvCell(row[header] ?? "")).join(",")
    }),
  ]

  return `${lines.join("\n")}\n`
}
