"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useState } from "react"

import {
  emailLoginAction,
  emailRegisterAction,
  googleStartAction,
  type AuthFormState,
} from "../../../lib/customer/actions"
import {
  Field,
  GoogleGlyph,
  cardStyle,
  errorBoxStyle,
  ghostBtnStyle,
  inputStyle,
  noticeBoxStyle,
  primaryBtnStyle,
} from "./_ui"

/**
 * Theme-agnostic sign-in / register card. Google + email/password, wired to the
 * tenant-aware auth server actions. Themes wrap this in their chrome and pass
 * their accent colour.
 */
export function LoginForm({
  next,
  error,
  notice,
  accent = "#111111",
}: {
  next: string
  error?: string | null
  notice?: string | null
  accent?: string
}) {
  const [mode, setMode] = useState<"signin" | "register">("signin")
  const [loginState, loginAction, loginPending] = useActionState<AuthFormState, FormData>(
    emailLoginAction,
    {}
  )
  const [registerState, registerAction, registerPending] = useActionState<AuthFormState, FormData>(
    emailRegisterAction,
    {}
  )
  const [googleState, googleAction, googlePending] = useActionState<AuthFormState, FormData>(
    googleStartAction,
    {}
  )

  const activeError =
    googleState.error || error || (mode === "signin" ? loginState.error : registerState.error)

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#1c1917" }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 13, color: "#78716c", margin: "0 0 20px" }}>
          {mode === "signin"
            ? "Sign in to check out, track orders, and save addresses."
            : "Sign up to check out faster and track your orders."}
        </p>

        {notice ? <div style={noticeBoxStyle}>{notice}</div> : null}
        {activeError ? <div style={errorBoxStyle}>{activeError}</div> : null}

        {/* Google */}
        <form action={googleAction}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            disabled={googlePending}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "11px 16px",
              background: "#fff",
              border: "1px solid #d6d3d1",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#1c1917",
              cursor: googlePending ? "default" : "pointer",
            }}
          >
            <GoogleGlyph />
            {googlePending ? "Redirecting…" : "Continue with Google"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <span style={{ flex: 1, height: 1, background: "#e7e5e4" }} />
          <span style={{ fontSize: 12, color: "#a8a29e" }}>or</span>
          <span style={{ flex: 1, height: 1, background: "#e7e5e4" }} />
        </div>

        {mode === "signin" ? (
          <form action={loginAction} key="signin">
            <input type="hidden" name="next" value={next} />
            <Field label="Email">
              <input name="email" type="email" required autoComplete="email" style={inputStyle} />
            </Field>
            <Field label="Password">
              <input name="password" type="password" required autoComplete="current-password" style={inputStyle} />
            </Field>
            <button type="submit" disabled={loginPending} style={primaryBtnStyle(accent, loginPending)}>
              {loginPending ? "Signing in…" : "Sign in"}
            </button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: "#78716c" }}>
                Forgot your password?
              </Link>
            </div>
          </form>
        ) : (
          <form action={registerAction} key="register">
            <input type="hidden" name="next" value={next} />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Field label="First name">
                  <input name="first_name" autoComplete="given-name" style={inputStyle} />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Last name">
                  <input name="last_name" autoComplete="family-name" style={inputStyle} />
                </Field>
              </div>
            </div>
            <Field label="Email">
              <input name="email" type="email" required autoComplete="email" style={inputStyle} />
            </Field>
            <Field label="Password">
              <input name="password" type="password" required autoComplete="new-password" minLength={8} style={inputStyle} />
            </Field>
            <button type="submit" disabled={registerPending} style={primaryBtnStyle(accent, registerPending)}>
              {registerPending ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#78716c" }}>
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button type="button" onClick={() => setMode("register")} style={{ ...ghostBtnStyle, border: "none", padding: 0, color: accent, background: "none" }}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("signin")} style={{ ...ghostBtnStyle, border: "none", padding: 0, color: accent, background: "none" }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
