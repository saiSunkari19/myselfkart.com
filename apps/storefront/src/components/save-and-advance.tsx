"use client"

import { useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"

/**
 * Drop inside a <form> that saves a checkout step. Detects the pending→idle
 * transition (the save just completed), shows a brief confirmation, and
 * smooth-scrolls the next step's section into view — so the wizard visibly
 * advances instead of silently re-rendering in place.
 */
export function SaveAndAdvance({
  nextSectionId,
  label = "Saved",
  style,
}: {
  nextSectionId: string
  label?: string
  style?: React.CSSProperties
}) {
  const { pending } = useFormStatus()
  const wasPending = useRef(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (wasPending.current && !pending) {
      setJustSaved(true)
      document.getElementById(nextSectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
      const t = setTimeout(() => setJustSaved(false), 2500)
      return () => clearTimeout(t)
    }
    wasPending.current = pending
  }, [pending, nextSectionId])

  if (!justSaved) return null
  return (
    <span style={{ color: "#1e8e4f", fontSize: 13, fontWeight: 600, marginLeft: 10, ...style }}>
      ✓ {label}
    </span>
  )
}
