"use client"

import { Check } from "lucide-react"
import { useActionState } from "react"

import { updateTenantHostAction, type HostState } from "@/actions/tenants"

const initial: HostState = { ok: false, error: null }

/**
 * Inline editor for a tenant's primary storefront host. On success the page is
 * revalidated server-side, so the new host flows back into the detail view.
 */
export function TenantHostForm({
  tenantId,
  currentHost,
}: {
  tenantId: string
  currentHost: string | null
}) {
  const [state, action, pending] = useActionState(updateTenantHostAction, initial)

  return (
    <form action={action} className="flex flex-col gap-3 px-6 py-5">
      <input type="hidden" name="id" value={tenantId} />
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="host"
          defaultValue={currentHost ?? ""}
          placeholder="acme.selfkart.com"
          required
          className="min-w-64 flex-1 rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none focus:border-line-strong"
        />
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-[var(--radius-md)] bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Saving…" : "Update host"}
        </button>
      </div>

      {state.ok ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-emerald-ink">
          <Check className="size-3.5" /> Host updated to {state.host}
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-xs text-red-ink">
          {state.error}
        </p>
      ) : null}
      <p className="text-xs text-ink-subtle">
        Repointing the host immediately changes which domain serves this store.
        The publishable key is preserved.
      </p>
    </form>
  )
}
