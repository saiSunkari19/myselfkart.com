"use client"

import { useFormStatus } from "react-dom"

/**
 * Submit button that shows its own pending state — `useFormStatus` reads the
 * pending flag of the nearest enclosing <form>, so this only needs to sit
 * inside the form it submits. No local state, no prop threading.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className,
  style,
}: {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
  style?: React.CSSProperties
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      style={{ ...style, opacity: pending ? 0.7 : style?.opacity, cursor: pending ? "wait" : style?.cursor }}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
