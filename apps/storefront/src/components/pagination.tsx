import Link from "next/link"

/** Numbered page links for the shop listing — styling is fully caller-supplied so each template can match its own look. */
export function Pagination({
  page,
  totalPages,
  buildHref,
  className,
  activeClassName,
  style,
  activeStyle,
}: {
  page: number
  totalPages: number
  buildHref: (page: number) => string
  className?: string
  activeClassName?: string
  style?: React.CSSProperties
  activeStyle?: React.CSSProperties
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav aria-label="Pagination" style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
      {page > 1 && (
        <Link href={buildHref(page - 1)} className={className} style={style}>← Prev</Link>
      )}
      {pages.map(p => (
        <Link
          key={p}
          href={buildHref(p)}
          className={p === page ? activeClassName : className}
          style={p === page ? { ...style, ...activeStyle } : style}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={buildHref(page + 1)} className={className} style={style}>Next →</Link>
      )}
    </nav>
  )
}
