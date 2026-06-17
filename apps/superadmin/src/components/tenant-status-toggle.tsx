"use client"

import { Power, PowerOff } from "lucide-react"
import { useActionState, useState } from "react"

import { updateTenantStatusAction, type StatusState } from "@/actions/tenants"

const initial: StatusState = { ok: false, error: null }

/**
 * Enable / disable control for a tenant's storefront. Disabling sets the tenant
 * to 'suspended' (store stops loading for buyers); enabling restores 'active'.
 * Disabling asks for a confirmation click first, since it takes a live store down.
 */
export function TenantStatusToggle({
  tenantId,
  status,
}: {
  tenantId: string
  status: string
}) {
  const [state, action, pending] = useActionState(updateTenantStatusAction, initial)
  const [confirming, setConfirming] = useState(false)

  // The page revalidates after a successful flip, so `status` reflects the
  // latest value; fall back to the action result during the brief re-render.
  const current = state.ok && state.status ? state.status : status
  const isActive = current === "active"
  const next = isActive ? "suspended" : "active"

  return (
    <div className="flex flex-col gap-2 px-6 py-5">
      <div className="flex flex-wrap items-center gap-3">
        {isActive && !confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-md)] border border-line px-4 py-2.5 text-sm text-red-ink transition-colors hover:border-line-strong"
          >
            <PowerOff className="size-4" /> Disable store
          </button>
        ) : null}

        {isActive && confirming ? (
          <form action={action} className="flex items-center gap-2">
            <input type="hidden" name="id" value={tenantId} />
            <input type="hidden" name="status" value={next} />
            <span className="text-sm text-ink-muted">Take this store offline?</span>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-md)] border border-line px-3 py-2 text-sm text-red-ink transition-colors hover:border-line-strong disabled:opacity-70"
            >
              <PowerOff className="size-4" /> {pending ? "Disabling…" : "Confirm disable"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer px-2 py-2 text-sm text-ink-subtle hover:text-ink"
            >
              Cancel
            </button>
          </form>
        ) : null}

        {!isActive ? (
          <form action={action}>
            <input type="hidden" name="id" value={tenantId} />
            <input type="hidden" name="status" value={next} />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-md)] bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Power className="size-4" /> {pending ? "Enabling…" : "Enable store"}
            </button>
          </form>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="text-xs text-red-ink">
          {state.error}
        </p>
      ) : null}
      <p className="text-xs text-ink-subtle">
        {isActive
          ? "A disabled store shows buyers a “currently unavailable” notice and serves no products or checkout."
          : "This store is offline — buyers see a “currently unavailable” notice."}
      </p>
    </div>
  )
}
