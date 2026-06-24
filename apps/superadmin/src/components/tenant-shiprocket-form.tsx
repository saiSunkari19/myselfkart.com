"use client"

import { Check, CircleCheck, CircleX, Copy, ShieldCheck, Truck } from "lucide-react"
import { useActionState, useState } from "react"

import {
  testTenantShiprocketAction,
  updateTenantShiprocketAction,
  type ShiprocketState,
  type ShiprocketTestState,
} from "@/actions/tenants"
import type { TenantShiprocketCredential } from "@/lib/types"

const initial: ShiprocketState = { ok: false, error: null }
const testInitial: ShiprocketTestState = { ok: false, tested: false, error: null }

export function TenantShiprocketForm({
  tenantId,
  credentials,
}: {
  tenantId: string
  credentials: TenantShiprocketCredential | null
}) {
  const [state, action, pending] = useActionState(updateTenantShiprocketAction, initial)
  const [testState, testAction, testPending] = useActionState(
    testTenantShiprocketAction,
    testInitial
  )
  const [copied, setCopied] = useState(false)
  const current = state.credentials ?? credentials
  const webhookUrl = `https://api.myselfkart.com/webhooks/delivery/${tenantId}`

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <form action={action} className="flex flex-col gap-5 px-6 py-5">
      <input type="hidden" name="id" value={tenantId} />

      {/* Focal cue: at-a-glance readiness */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-ink-muted" />
          <div>
            <p className="text-sm font-medium text-ink">Shiprocket</p>
            <p className="text-xs text-ink-subtle">
              {current?.ready
                ? `Pushing orders · API user ${current.api_email}`
                : "Not connected — orders won't sync"}
            </p>
          </div>
        </div>
        <span
          className={`rounded-[var(--radius-full)] border px-2 py-0.5 text-xs ${
            current?.ready && current.enabled
              ? "border-emerald-ink text-emerald-ink"
              : "border-line text-ink-muted"
          }`}
        >
          {current?.ready && current.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5 lg:col-span-2">
          <span className="text-xs text-ink-subtle">API user email</span>
          <input
            name="api_email"
            type="email"
            defaultValue={current?.api_email ?? ""}
            placeholder="api-user@store.com"
            required
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none focus:border-line-strong"
          />
          <span className="text-xs text-ink-subtle">
            Create a dedicated API user in Shiprocket (Settings → API → Create an API
            User) — its email must differ from the login email.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-subtle">
            API password{" "}
            {current ? `(blank keeps ****${current.api_password_hint})` : ""}
          </span>
          <input
            name="api_password"
            type="password"
            placeholder={current ? "Leave blank to keep current" : "Required"}
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none focus:border-line-strong"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-subtle">Pickup location</span>
          <input
            name="pickup_location"
            list="shiprocket-pickups"
            defaultValue={current?.pickup_location ?? ""}
            placeholder="Leave blank to use the account's primary"
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-line-strong"
          />
          {testState.pickupLocations?.length ? (
            <>
              <datalist id="shiprocket-pickups">
                {testState.pickupLocations.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <span className="text-xs text-ink-subtle">
                From this account: {testState.pickupLocations.join(", ")}
              </span>
            </>
          ) : null}
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-muted lg:col-span-2">
          <input
            name="enabled"
            type="checkbox"
            defaultChecked={Boolean(current?.enabled)}
            className="size-4 accent-white"
          />
          <span>Enable Shiprocket — push new orders to this seller&apos;s account</span>
        </label>
      </div>

      {/* Distinct, guided step: the webhook the operator must register in Shiprocket */}
      <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-line bg-surface-2 px-4 py-3">
        <p className="text-xs font-medium text-ink">Status webhook</p>
        <p className="text-xs text-ink-subtle">
          In the seller&apos;s Shiprocket panel (Settings → API → Webhook), set Auth
          Token Type <span className="text-ink-muted">x-api-key</span> and paste this URL:
        </p>
        <div className="flex items-stretch gap-2">
          <code className="flex-1 overflow-x-auto rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 font-mono text-xs text-ink">
            {webhookUrl}
          </code>
          <button
            type="button"
            onClick={copyWebhook}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-line px-3 text-xs text-ink-muted transition-colors hover:bg-surface hover:text-ink cursor-pointer"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <label className="mt-1 flex flex-col gap-1.5">
          <span className="text-xs text-ink-subtle">
            Webhook token{" "}
            {current?.webhook_secret_hint
              ? `(blank keeps ****${current.webhook_secret_hint})`
              : "(blank uses the platform fallback secret)"}
          </span>
          <input
            name="webhook_secret"
            type="password"
            placeholder="Per-seller x-api-key value"
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none focus:border-line-strong"
          />
        </label>
      </div>

      {state.ok ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-emerald-ink">
          <Check className="size-3.5" /> Shiprocket credentials saved
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-xs text-red-ink">
          {state.error}
        </p>
      ) : null}
      {testState.tested && testState.ok ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-emerald-ink">
          <CircleCheck className="size-3.5" /> Connected
          {testState.pickupLocations?.length
            ? ` · pickups: ${testState.pickupLocations.join(", ")}`
            : ""}
        </p>
      ) : null}
      {testState.tested && !testState.ok ? (
        <p role="alert" className="inline-flex items-center gap-1.5 text-xs text-red-ink">
          <CircleX className="size-3.5" /> {testState.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
          <ShieldCheck className="size-3.5" /> Secrets are encrypted and never shown
          again.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            formAction={testAction}
            disabled={testPending}
            className="cursor-pointer rounded-[var(--radius-md)] border border-line px-4 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-70"
          >
            {testPending ? "Testing…" : "Test connection"}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer rounded-[var(--radius-md)] bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Saving…" : "Save Shiprocket"}
          </button>
        </div>
      </div>
    </form>
  )
}
