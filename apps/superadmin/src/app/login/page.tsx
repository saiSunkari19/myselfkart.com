"use client"

import { useActionState } from "react"

import { loginAction, type LoginState } from "@/actions/auth"

const initial: LoginState = { error: null }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial)

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* One clear focal point: the login card. Nothing competes with it. */}
        <div className="mb-10">
          <div className="text-headline tracking-tight">Selfkart</div>
          <p className="mt-1 text-sm text-ink-subtle">Platform console</p>
        </div>

        <form action={formAction} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-ink-muted">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-line-strong"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-ink-muted">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-line-strong"
            />
          </label>

          {state.error ? (
            <p role="alert" className="text-sm text-red-ink">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 cursor-pointer rounded-[var(--radius-md)] bg-ink px-4 py-3 font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  )
}
