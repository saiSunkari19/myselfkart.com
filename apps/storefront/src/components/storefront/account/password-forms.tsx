"use client"

import Link from "next/link"
import { useActionState } from "react"

import {
  requestPasswordResetAction,
  resetPasswordAction,
  type AuthFormState,
} from "../../../lib/customer/actions"
import { Field, cardStyle, errorBoxStyle, inputStyle, noticeBoxStyle, primaryBtnStyle } from "./_ui"

/** "Forgot password" — requests a reset email. Always reports success (no enumeration). */
export function ForgotPasswordForm({ accent = "#111111" }: { accent?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordResetAction,
    {}
  )

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#1c1917" }}>Reset your password</h1>
        <p style={{ fontSize: 13, color: "#78716c", margin: "0 0 20px" }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {state.sent ? (
          <div style={noticeBoxStyle}>
            If an account exists for that email, a reset link is on its way. Check your inbox.
          </div>
        ) : (
          <form action={action}>
            <Field label="Email">
              <input name="email" type="email" required autoComplete="email" style={inputStyle} />
            </Field>
            <button type="submit" disabled={pending} style={primaryBtnStyle(accent, pending)}>
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link href="/login" style={{ fontSize: 13, color: "#78716c" }}>← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}

/** "Reset password" — sets a new password using the token+email from the email link. */
export function ResetPasswordForm({
  token,
  email,
  accent = "#111111",
}: {
  token: string
  email: string
  accent?: string
}) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(resetPasswordAction, {})

  const invalid = !token || !email

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#1c1917" }}>Choose a new password</h1>
        <p style={{ fontSize: 13, color: "#78716c", margin: "0 0 20px" }}>{email}</p>

        {invalid ? (
          <div style={errorBoxStyle}>
            This reset link is invalid or incomplete. <Link href="/forgot-password">Request a new one</Link>.
          </div>
        ) : (
          <form action={action}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="email" value={email} />
            {state.error ? <div style={errorBoxStyle}>{state.error}</div> : null}
            <Field label="New password">
              <input name="password" type="password" required minLength={8} autoComplete="new-password" style={inputStyle} />
            </Field>
            <button type="submit" disabled={pending} style={primaryBtnStyle(accent, pending)}>
              {pending ? "Updating…" : "Reset password"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link href="/login" style={{ fontSize: 13, color: "#78716c" }}>← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
