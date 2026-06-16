import type { ApplicationStatus } from "@/lib/types"

type StatusKind = ApplicationStatus | string

// Neutral chip + a semantic dot/label. Light "-ink" colours on the dark chip
// clear WCAG AA comfortably (no low-contrast same-hue tint badges).
const MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "var(--color-amber-ink)" },
  approved: { label: "Approved", color: "var(--color-blue-ink)" },
  provisioning: { label: "Provisioning", color: "var(--color-blue-ink)" },
  active: { label: "Active", color: "var(--color-emerald-ink)" },
  rejected: { label: "Rejected", color: "var(--color-slate-ink)" },
  failed: { label: "Failed", color: "var(--color-red-ink)" },
  suspended: { label: "Suspended", color: "var(--color-red-ink)" },
  draft: { label: "Draft", color: "var(--color-amber-ink)" },
}

export function StatusBadge({ status }: { status: StatusKind }) {
  const entry = MAP[status] ?? { label: status, color: "var(--color-slate-ink)" }
  return (
    <span
      className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-line bg-surface-2 px-3 py-1 text-xs font-medium"
      style={{ color: entry.color }}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-[var(--radius-full)]"
        style={{ background: entry.color }}
      />
      {entry.label}
    </span>
  )
}
