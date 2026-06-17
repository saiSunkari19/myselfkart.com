"use client"

import { Trash2 } from "lucide-react"
import { useActionState, useState } from "react"

import { deleteAllDisabledAction, type BulkDeleteState } from "@/actions/tenants"

const initial: BulkDeleteState = { ok: false, error: null }

/**
 * Bulk-deletes every disabled (suspended/draft) tenant. Active stores and any
 * store with real orders are never touched. Two-step confirm since it is
 * irreversible.
 */
export function DeleteDisabledButton({ disabledCount }: { disabledCount: number }) {
  const [state, action, pending] = useActionState(deleteAllDisabledAction, initial)
  const [confirming, setConfirming] = useState(false)

  if (disabledCount === 0) {
    return null
  }

  if (confirming) {
    return (
      <form action={action} className="flex items-center gap-2">
        <span className="text-sm text-ink-muted">
          Delete {disabledCount} disabled store{disabledCount === 1 ? "" : "s"}?
        </span>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-md)] border border-red-ink/40 px-3 py-2 text-sm text-red-ink transition-colors hover:border-red-ink disabled:opacity-60"
        >
          <Trash2 className="size-4" /> {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="cursor-pointer px-2 py-2 text-sm text-ink-subtle hover:text-ink"
        >
          Cancel
        </button>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {state.ok && typeof state.deleted === "number" ? (
        <span className="text-sm text-ink-muted">
          Deleted {state.deleted}
          {state.skipped ? `, skipped ${state.skipped}` : ""}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-line px-4 py-2 text-sm text-red-ink transition-colors hover:border-line-strong"
      >
        <Trash2 className="size-3.5" /> Delete disabled ({disabledCount})
      </button>
    </div>
  )
}
