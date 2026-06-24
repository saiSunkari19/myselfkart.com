"use client"

import { useEffect, useState } from "react"

/**
 * Generic auto + manual carousel for testimonial/review sections. Renders a
 * plain static grid when there's nothing to slide (items.length <= visibleCount)
 * so short lists look identical to before. Once a seller adds more than
 * `visibleCount` items, it switches to a sliding track that advances one card
 * at a time, both automatically and via prev/next arrows + dots.
 */
export function TestimonialSlider<T>({
  items,
  renderItem,
  visibleCount = 3,
  gap = 24,
  intervalMs = 5000,
  accentColor = "#1a1a1a",
}: {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  visibleCount?: number
  gap?: number
  intervalMs?: number
  accentColor?: string
}) {
  // Responsive: show fewer cards on smaller screens so short lists (e.g. the
  // default 3 testimonials) become a real one-card slider on mobile instead of
  // a cramped 3-column grid. Starts at the desktop count for SSR, then adjusts.
  const [vis, setVis] = useState(visibleCount)
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setVis(w < 640 ? 1 : w < 1024 ? Math.min(2, visibleCount) : visibleCount)
    }
    update()
    window.addEventListener("resize", update, { passive: true })
    return () => window.removeEventListener("resize", update)
  }, [visibleCount])

  const maxIndex = Math.max(0, items.length - vis)
  const [index, setIndex] = useState(0)
  const sliding = items.length > vis

  // Keep the active index in range when the visible count changes (resize).
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  useEffect(() => {
    if (!sliding) return
    const t = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1))
    }, intervalMs)
    return () => clearInterval(t)
  }, [sliding, maxIndex, intervalMs])

  if (!sliding) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${vis}, minmax(0, 1fr))`, gap }}>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    )
  }

  const goPrev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1))
  const goNext = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1))

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              gap,
              transform: `translateX(calc(-${index} * (100% + ${gap}px) / ${vis}))`,
              transition: "transform 0.5s ease",
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                style={{ flex: `0 0 calc((100% - ${gap * (vis - 1)}px) / ${vis})`, minWidth: 0 }}
              >
                {renderItem(item, i)}
              </div>
            ))}
          </div>
        </div>
        <button
          aria-label="Previous testimonials"
          onClick={goPrev}
          style={arrowStyle("left", accentColor)}
        >
          ‹
        </button>
        <button
          aria-label="Next testimonials"
          onClick={goNext}
          style={arrowStyle("right", accentColor)}
        >
          ›
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: i === index ? accentColor : "#d8d4cd",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  )
}

const arrowStyle = (side: "left" | "right", color: string): React.CSSProperties => ({
  position: "absolute",
  top: "50%",
  [side]: -16,
  transform: "translateY(-50%)",
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "1px solid rgba(0,0,0,0.1)",
  background: "#fff",
  color,
  fontSize: 20,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  zIndex: 1,
})
