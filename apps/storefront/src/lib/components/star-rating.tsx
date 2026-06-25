/**
 * Renders a 5-star rating that supports fractional values (e.g. 3.5) by
 * overlaying a clipped, fully-colored star row on top of a muted one. Inherits
 * text color from the parent (e.g. a `.testimonialStars` class) for the filled
 * portion, so themes keep their own star color without passing it in.
 */
export function StarRating({
  rating,
  max = 5,
  emptyColor = "#d8d8d8",
}: {
  rating: number
  max?: number
  emptyColor?: string
}) {
  const pct = Math.max(0, Math.min(100, (rating / max) * 100))
  const stars = "★".repeat(max)
  return (
    <span style={{ position: "relative", display: "inline-block", lineHeight: 1 }}>
      <span style={{ color: emptyColor }}>{stars}</span>
      <span
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          width: `${pct}%`,
          whiteSpace: "nowrap",
        }}
      >
        {stars}
      </span>
    </span>
  )
}
