"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/**
 * Thin top progress bar shown during navigation, so clicking a link or
 * submitting a server-action form gives instant feedback instead of a frozen
 * page. Starts on same-origin anchor clicks and form submits; completes when
 * the route actually changes. Same-path server-action redirects (e.g. cart
 * qty update → /cart) don't change the pathname, so a safety timeout finishes
 * the bar rather than letting it hang. Styled with the store's brand colour.
 */
export function RouteProgress() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const timers = useRef<{ inc?: ReturnType<typeof setInterval>; done?: ReturnType<typeof setTimeout> }>({})

  function clearTimers() {
    if (timers.current.inc) clearInterval(timers.current.inc)
    if (timers.current.done) clearTimeout(timers.current.done)
    timers.current = {}
  }

  function start() {
    clearTimers()
    setVisible(true)
    setWidth(8)
    timers.current.inc = setInterval(() => {
      setWidth((w) => (w < 90 ? w + (90 - w) * 0.15 : w))
    }, 200)
    timers.current.done = setTimeout(finish, 4000)
  }

  function finish() {
    clearTimers()
    setWidth(100)
    timers.current.done = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 300)
  }

  // Route changed → complete the bar.
  useEffect(() => {
    finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest?.("a")
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (!href || anchor.target === "_blank" || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      try {
        const url = new URL(anchor.href)
        if (url.origin !== location.origin) return
        if (url.pathname === location.pathname && url.search === location.search) return
      } catch {
        return
      }
      start()
    }
    function onSubmit() {
      start()
    }
    document.addEventListener("click", onClick, true)
    document.addEventListener("submit", onSubmit, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("submit", onSubmit, true)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, pointerEvents: "none" }}>
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "var(--store-accent, var(--store-primary, #2563eb))",
          transition: "width 0.2s ease",
          boxShadow: "0 0 8px var(--store-accent, #2563eb)",
        }}
      />
    </div>
  )
}
