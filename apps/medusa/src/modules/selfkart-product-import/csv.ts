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

export function toMedusaImportRows(rows: CsvRow[]): CsvRow[] {
  return rows.map((row) => {
    return Object.entries(row).reduce<CsvRow>((safeRow, [header, value]) => {
      if (isAssociationOnlyColumn(header) || isRawReferenceColumn(header)) {
        return safeRow
      }

      safeRow[header] = value
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
