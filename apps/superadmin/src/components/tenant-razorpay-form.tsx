"use client"

import { Check, CreditCard, ShieldCheck } from "lucide-react"
import { useActionState } from "react"

import {
  updateTenantRazorpayAction,
  type RazorpayState,
} from "@/actions/tenants"
import type { TenantPaymentCredential } from "@/lib/types"

const initial: RazorpayState = { ok: false, error: null }

export function TenantRazorpayForm({
  tenantId,
  credentials,
}: {
  tenantId: string
  credentials: TenantPaymentCredential | null
}) {
  const [state, action, pending] = useActionState(updateTenantRazorpayAction, initial)
  const current = state.credentials ?? credentials
  const mode = current?.mode ?? "test"

  return (
    <form action={action} className="flex flex-col gap-5 px-6 py-5">
      <input type="hidden" name="id" value={tenantId} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-ink-muted" />
          <div>
            <p className="text-sm font-medium text-ink">Razorpay</p>
            <p className="text-xs text-ink-subtle">
              {current?.ready
                ? `${current.mode} mode · key ending ${current.key_secret_hint}`
                : "Not ready for checkout"}
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
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-subtle">Mode</span>
          <select
            name="mode"
            defaultValue={mode}
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-line-strong"
          >
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
        </label>

        <label className="flex items-end gap-2 text-sm text-ink-muted">
          <input
            name="enabled"
            type="checkbox"
            defaultChecked={Boolean(current?.enabled)}
            className="mb-3 size-4 accent-white"
          />
          <span className="pb-2.5">Enable Razorpay for this seller</span>
        </label>

        <label className="flex flex-col gap-1.5 lg:col-span-2">
          <span className="text-xs text-ink-subtle">Key ID</span>
          <input
            name="key_id"
            defaultValue={current?.key_id ?? ""}
            placeholder="rzp_test_..."
            required
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none focus:border-line-strong"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-subtle">
            Key secret {current ? `(blank keeps ****${current.key_secret_hint})` : ""}
          </span>
          <input
            name="key_secret"
            type="password"
            placeholder={current ? "Leave blank to keep current" : "Required"}
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none focus:border-line-strong"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-subtle">
            Webhook secret{" "}
            {current ? `(blank keeps ****${current.webhook_secret_hint})` : ""}
          </span>
          <input
            name="webhook_secret"
            type="password"
            placeholder={current ? "Leave blank to keep current" : "Required"}
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none focus:border-line-strong"
          />
        </label>
      </div>

      {state.ok ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-emerald-ink">
          <Check className="size-3.5" /> Razorpay credentials saved
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-xs text-red-ink">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
          <ShieldCheck className="size-3.5" /> Secrets are encrypted and never shown
          again.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-[var(--radius-md)] bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Saving…" : "Save Razorpay"}
        </button>
      </div>
    </form>
  )
}
