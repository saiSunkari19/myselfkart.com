"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"

import { deleteTenantAction, type DeleteState } from "@/actions/tenants"

const initial: DeleteState = { ok: false, error: null }

/**
 * Permanently deletes a tenant and all of its data. Guarded by a typed
 * confirmation (the operator must type the store slug) since it is irreversible.
 * If the platform API blocks deletion because the store has real orders, a
 * "delete anyway" force option appears.
 */
export function TenantDeletePanel({
  tenantId,
  slug,
}: {
  tenantId: string
  slug: string
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(deleteTenantAction, initial)
  const [confirm, setConfirm] = useState("")

  // On success the tenant is gone; leave the (now-404) detail page.
  useEffect(() => {
    if (state.ok) {
      router.push("/tenants")
    }
  }, [state.ok, router])

  const matches = confirm.trim() === slug
  const blocked = typeof state.blockedByOrders === "number"

  return (
    <div className="flex flex-col gap-3 px-6 py-5">
      <p className="text-sm text-ink-muted">
        Permanently delete this store and everything in it — products, orders,
        customers, channel, inventory, domain and the seller login. This cannot be
        undone. The shared region/currency is kept.
      </p>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-subtle">
          Type <span className="font-mono text-ink">{slug}</span> to confirm
        </span>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={slug}
          className="max-w-xs rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2 font-mono text-ink outline-none focus:border-line-strong"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-red-ink">
          {state.error}
        </p>
      ) : null}

      <form action={action} className="flex items-center gap-3">
        <input type="hidden" name="id" value={tenantId} />
        {blocked ? <input type="hidden" name="force" value="true" /> : null}
        <button
          type="submit"
          disabled={!matches || pending}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-md)] border border-red-ink/40 px-4 py-2.5 text-sm text-red-ink transition-colors hover:border-red-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="size-4" />
          {pending
            ? "Deleting…"
            : blocked
              ? "Delete anyway (incl. orders)"
              : "Delete store permanently"}
        </button>
      </form>
    </div>
  )
}
