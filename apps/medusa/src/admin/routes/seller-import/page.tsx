import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowUpTray } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
} from "@medusajs/ui"
import { useMemo, useState } from "react"

type ImportSummary = {
  toCreate?: number
  toUpdate?: number
  linked_products?: number
  stocked_quantity?: number
  collections?: number
  types?: number
  tags?: number
  categories?: number
}

type PrepareResponse = {
  medusa_csv: string
  summary: ImportSummary
}

type ImportResponse = {
  transaction_id: string
  summary: ImportSummary
}

type CompleteResponse = {
  summary: ImportSummary
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof body.message === "string"
        ? body.message
        : `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return body as T
}

const SellerImportPage = () => {
  const [file, setFile] = useState<File | null>(null)
  const [sellerName, setSellerName] = useState("Selfkart Seller")
  const [stockedQuantity, setStockedQuantity] = useState("100")
  const [status, setStatus] = useState("Idle")
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const canImport = useMemo(() => {
    return Boolean(file) && !isImporting && Number(stockedQuantity) > 0
  }, [file, isImporting, stockedQuantity])

  const handleImport = async () => {
    if (!file) {
      return
    }

    setIsImporting(true)
    setError(null)
    setSummary(null)

    try {
      setStatus("Preparing CSV")
      const originalCsv = await file.text()
      const prepareForm = new FormData()
      prepareForm.append("file", file)

      const prepared = await readJsonResponse<PrepareResponse>(
        await fetch("/admin/selfkart/product-imports/prepare", {
          method: "POST",
          body: prepareForm,
          credentials: "include",
        })
      )

      setStatus("Importing products")
      const medusaFile = new File([prepared.medusa_csv], file.name, {
        type: "text/csv",
      })
      const importForm = new FormData()
      importForm.append("file", medusaFile)

      const imported = await readJsonResponse<ImportResponse>(
        await fetch("/admin/products/import", {
          method: "POST",
          body: importForm,
          credentials: "include",
        })
      )

      setStatus("Confirming import")
      await readJsonResponse<Record<string, never>>(
        await fetch(`/admin/products/import/${imported.transaction_id}/confirm`, {
          method: "POST",
          credentials: "include",
        })
      )

      setStatus("Linking catalogue and inventory")
      const completed = await readJsonResponse<CompleteResponse>(
        await fetch("/admin/selfkart/product-imports/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            csv: originalCsv,
            seller_name: sellerName,
            stocked_quantity: Number(stockedQuantity),
          }),
        })
      )

      setSummary({
        ...prepared.summary,
        ...imported.summary,
        ...completed.summary,
      })
      setStatus("Imported")
    } catch (e) {
      setStatus("Failed")
      setError(e instanceof Error ? e.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Seller Import</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Upload products, catalogue links, and starter inventory in one flow.
          </Text>
        </div>
        <Badge color={status === "Failed" ? "red" : status === "Imported" ? "green" : "grey"}>
          {status}
        </Badge>
      </div>

      <div className="grid gap-6 p-6">
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-2">
            <Label htmlFor="seller-import-file">CSV file</Label>
            <Input
              id="seller-import-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seller-import-name">Seller name</Label>
            <Input
              id="seller-import-name"
              value={sellerName}
              onChange={(event) => setSellerName(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seller-import-quantity">Stocked quantity</Label>
            <Input
              id="seller-import-quantity"
              min={1}
              type="number"
              value={stockedQuantity}
              onChange={(event) => setStockedQuantity(event.target.value)}
            />
          </div>

          <Button disabled={!canImport} isLoading={isImporting} onClick={handleImport}>
            <ArrowUpTray />
            Import products
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-ui-border-error bg-ui-bg-error px-4 py-3">
            <Text className="text-ui-fg-error" size="small">
              {error}
            </Text>
          </div>
        )}

        {summary && (
          <div className="grid max-w-xl grid-cols-2 gap-3">
            <SummaryItem label="Created" value={summary.toCreate ?? 0} />
            <SummaryItem label="Updated" value={summary.toUpdate ?? 0} />
            <SummaryItem label="Linked" value={summary.linked_products ?? 0} />
            <SummaryItem label="Stock" value={summary.stocked_quantity ?? 0} />
            <SummaryItem label="Collections" value={summary.collections ?? 0} />
            <SummaryItem label="Categories" value={summary.categories ?? 0} />
          </div>
        )}
      </div>
    </Container>
  )
}

const SummaryItem = ({ label, value }: { label: string; value: number }) => {
  return (
    <div className="rounded-md border border-ui-border-base px-4 py-3">
      <Text className="text-ui-fg-subtle" size="small">
        {label}
      </Text>
      <Text className="text-ui-fg-base" weight="plus">
        {value}
      </Text>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Seller Import",
  icon: ArrowUpTray,
})

export default SellerImportPage
