import type { ReactNode } from "react"

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-line px-10 py-8">
      <div>
        <h1 className="text-section">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-line bg-surface ${className}`}
    >
      {title ? (
        <header className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-medium text-ink-muted">{title}</h2>
        </header>
      ) : null}
      {children}
    </section>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-6 py-16 text-center text-sm text-ink-subtle">{children}</div>
  )
}
