"use client"

import { Check, Copy, KeyRound } from "lucide-react"
import { useActionState, useState } from "react"

import { resetTenantPasswordAction, type PasswordState } from "@/actions/tenants"

const initial: PasswordState = { ok: false, error: null }

/**
 * Seller login section: read-only login email plus a control to set or generate
 * a password. On success it reveals the credential once so the operator can copy
 * and share it with the seller. The seller signs into /admin with these.
 */
export function TenantLoginPanel({
  tenantId,
  email,
}: {
  tenantId: string
  email: string | null
}) {
  const [state, action, pending] = useActionState(resetTenantPasswordAction, initial)
  const [custom, setCustom] = useState(false)

  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-subtle">Login email (read-only)</span>
        <input
          readOnly
          value={email ?? "—"}
          className="cursor-default rounded-[var(--radius-md)] border border-line bg-surface-2 px-4 py-2.5 font-mono text-sm text-ink outline-none"
        />
      </label>

      {state.ok && state.credential ? (
        <CredentialReveal credential={state.credential} />
      ) : (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={tenantId} />

          {custom ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-subtle">New password (min 8 chars)</span>
              <input
                name="password"
                type="text"
                minLength={8}
                required
                placeholder="Enter a password"
                className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none focus:border-line-strong"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-md)] bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <KeyRound className="size-4" />
              {pending ? "Saving…" : custom ? "Set password" : "Generate password"}
            </button>
            <button
              type="button"
              onClick={() => setCustom((c) => !c)}
              className="cursor-pointer px-2 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {custom ? "Generate one instead" : "Set my own"}
            </button>
          </div>
        </form>
      )}

      {state.error ? (
        <p role="alert" className="text-xs text-red-ink">
          {state.error}
        </p>
      ) : null}
      <p className="text-xs text-ink-subtle">
        The password is shown once here. Share the email + password with the seller;
        they sign in to the store admin with them.
      </p>
    </div>
  )
}

function CredentialReveal({
  credential,
}: {
  credential: { email: string; password: string }
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard?.writeText(
      `Admin email: ${credential.email}\nPassword: ${credential.password}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium text-emerald-ink">
        <Check className="size-4" /> Password set
      </p>
      <dl className="mt-3 space-y-1.5 text-ink-muted">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-subtle">Email</dt>
          <dd className="truncate text-ink">{credential.email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-subtle">Password</dt>
          <dd className="truncate font-mono text-ink">{credential.password}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={copy}
        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
      >
        <Copy className="size-3.5" /> {copied ? "Copied" : "Copy login details"}
      </button>
    </div>
  )
}
