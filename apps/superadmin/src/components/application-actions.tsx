"use client"

import { Check, Copy, X } from "lucide-react"
import { useActionState, useState } from "react"

import { approveAction, rejectAction, type ReviewState } from "@/actions/applications"

const initial: ReviewState = { ok: false, error: null }

/**
 * Approve / reject controls for one application. Approve provisions the seller
 * inline and reveals the one-time admin credential on success; reject collects
 * an optional reason. Both use React 19 useActionState against server actions.
 */
export function ApplicationActions({
  id,
  retry = false,
}: {
  id: string
  retry?: boolean
}) {
  const [approveState, approve, approving] = useActionState(approveAction, initial)
  const [rejectState, reject, rejecting] = useActionState(rejectAction, initial)
  const [showReject, setShowReject] = useState(false)

  if (approveState.ok && approveState.credential) {
    return <CredentialReveal credential={approveState.credential} />
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {!showReject ? (
          <form action={approve}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              disabled={approving}
              className="cursor-pointer rounded-[var(--radius-md)] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {approving ? "Provisioning…" : retry ? "Retry provisioning" : "Approve"}
            </button>
          </form>
        ) : null}

        {!retry && !showReject ? (
          <button
            type="button"
            onClick={() => setShowReject(true)}
            className="cursor-pointer rounded-[var(--radius-md)] border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            Reject
          </button>
        ) : null}
      </div>

      {showReject ? (
        <form action={reject} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input
            name="reason"
            placeholder="Reason (optional)"
            className="w-48 rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-line-strong"
          />
          <button
            type="submit"
            disabled={rejecting}
            className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-md)] border border-line px-3 py-2 text-sm text-red-ink transition-colors hover:border-line-strong disabled:opacity-70"
          >
            <X className="size-4" /> Confirm
          </button>
          <button
            type="button"
            onClick={() => setShowReject(false)}
            className="cursor-pointer px-2 py-2 text-sm text-ink-subtle hover:text-ink"
          >
            Cancel
          </button>
        </form>
      ) : null}

      {approveState.error ? (
        <p role="alert" className="max-w-xs text-right text-xs text-red-ink">
          {approveState.error}
        </p>
      ) : null}
      {rejectState.error ? (
        <p role="alert" className="text-xs text-red-ink">
          {rejectState.error}
        </p>
      ) : null}
    </div>
  )
}

function CredentialReveal({
  credential,
}: {
  credential: { adminEmail: string; tempPassword: string; host: string }
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard?.writeText(
      `Store: https://${credential.host}\nAdmin email: ${credential.adminEmail}\nTemporary password: ${credential.tempPassword}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="w-72 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium text-emerald-ink">
        <Check className="size-4" /> Provisioned
      </p>
      <dl className="mt-3 space-y-1.5 text-ink-muted">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-subtle">Store</dt>
          <dd className="truncate text-ink">{credential.host}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-subtle">Admin</dt>
          <dd className="truncate text-ink">{credential.adminEmail}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-subtle">Password</dt>
          <dd className="truncate font-mono text-ink">{credential.tempPassword}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={copy}
        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
      >
        <Copy className="size-3.5" /> {copied ? "Copied" : "Copy handoff details"}
      </button>
      <p className="mt-2 text-xs text-ink-subtle">Shown once. Share it securely.</p>
    </div>
  )
}
