import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CreditCard } from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type RazorpayStatus = {
  mode: "test" | "live"
  enabled: boolean
  ready: boolean
  key_id: string
  key_secret_hint: string
  webhook_secret_hint: string
  updated_at: string
}

type StatusResponse = {
  razorpay: RazorpayStatus | null
}

const SellerPaymentsPage = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const response = await fetch("/admin/selfkart/payment-config/status", {
          credentials: "include",
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(
            typeof body.message === "string"
              ? body.message
              : `Request failed with status ${response.status}`
          )
        }
        if (!cancelled) {
          setStatus(body as StatusResponse)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load payment status")
        }
      }
    }

    loadStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const razorpay = status?.razorpay ?? null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Seller Payments</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Razorpay status for this store. Platform admin manages credentials.
          </Text>
        </div>
        <Badge color={razorpay?.ready && razorpay.enabled ? "green" : "grey"}>
          {razorpay?.ready && razorpay.enabled ? "Ready" : "Not ready"}
        </Badge>
      </div>

      <div className="grid gap-4 p-6">
        {error ? (
          <div className="rounded-md border border-ui-border-error bg-ui-bg-error px-4 py-3">
            <Text className="text-ui-fg-error" size="small">
              {error}
            </Text>
          </div>
        ) : null}

        {!status && !error ? (
          <Text className="text-ui-fg-subtle" size="small">
            Loading payment status…
          </Text>
        ) : null}

        {status ? (
          <div className="grid max-w-xl gap-3">
            <StatusRow label="Provider" value="Razorpay" />
            <StatusRow label="Mode" value={razorpay?.mode ?? "—"} />
            <StatusRow label="Key ID" value={razorpay?.key_id ?? "Not configured"} />
            <StatusRow
              label="Key secret"
              value={razorpay ? `Stored, ending ${razorpay.key_secret_hint}` : "Missing"}
            />
            <StatusRow
              label="Webhook secret"
              value={
                razorpay
                  ? `Stored, ending ${razorpay.webhook_secret_hint}`
                  : "Missing"
              }
            />
            <StatusRow
              label="Checkout"
              value={razorpay?.ready && razorpay.enabled ? "Enabled" : "Disabled"}
            />
          </div>
        ) : null}
      </div>
    </Container>
  )
}

const StatusRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 rounded-md border border-ui-border-base px-4 py-3 text-sm">
    <Text className="text-ui-fg-subtle" size="small">
      {label}
    </Text>
    <Text className="text-ui-fg-base text-right font-mono" size="small">
      {value}
    </Text>
  </div>
)

export const config = defineRouteConfig({
  label: "Seller Payments",
  icon: CreditCard,
})

export default SellerPaymentsPage
