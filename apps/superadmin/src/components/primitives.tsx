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

/**
 * A pulsing placeholder block. Used by route-level loading.tsx files so a console
 * navigation paints instantly (the server fetch runs behind this Suspense
 * fallback) instead of appearing frozen on click.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-md)] bg-surface-2 ${className}`}
      aria-hidden
    />
  )
}

/** Header skeleton mirroring <PageHeader> so the shell doesn't shift on load. */
export function PageHeaderSkeleton() {
  return (
    <div className="border-b border-line px-10 py-8">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
    </div>
  )
}
