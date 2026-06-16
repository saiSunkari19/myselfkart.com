import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { EmptyState, PageHeader, Panel } from "@/components/primitives"
import { StatusBadge } from "@/components/status-badge"
import { formatDate } from "@/lib/format"
import { platformFetch } from "@/lib/medusa"
import type { Overview } from "@/lib/types"

export default async function DashboardPage() {
  const overview = await platformFetch<Overview>("/selfkart/platform/overview")
  const { counts, recentApplications, recentTenants } = overview
  const pending = recentApplications.filter((a) => a.status === "pending")

  return (
    <>
      <PageHeader title="Overview" subtitle="Seller onboarding at a glance." />

      <div className="space-y-10 px-10 py-8">
        {/* Hero: the one number that drives the operator's day, plus a direct
            path to act on it. Secondary counts sit to the side, deliberately
            smaller so they don't compete. */}
        <div className="flex flex-wrap items-stretch gap-4">
          <Link
            href="/applications?status=pending"
            className="group flex min-w-72 flex-1 flex-col justify-between rounded-[var(--radius-lg)] border border-line bg-surface p-6 transition-colors hover:border-line-strong"
          >
            <span className="text-sm text-ink-muted">Applications awaiting review</span>
            <span className="mt-6 flex items-end gap-3">
              <span className="text-display tabular-nums">
                {counts.pendingApplications}
              </span>
              <span className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted transition-colors group-hover:text-ink">
                Review <ArrowRight className="size-4" />
              </span>
            </span>
          </Link>

          <div className="grid min-w-56 grid-cols-1 gap-4">
            <Stat label="Active stores" value={counts.activeTenants} />
            <Stat label="Total tenants" value={counts.totalTenants} />
          </div>
        </div>

        <Panel title="Needs review">
          {pending.length === 0 ? (
            <EmptyState>No applications are waiting. You&rsquo;re all caught up.</EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {pending.map((app) => (
                <li key={app.id}>
                  <Link
                    href="/applications?status=pending"
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{app.store_name}</p>
                      <p className="truncate text-sm text-ink-subtle">
                        {app.desired_subdomain} · {app.owner_email}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="hidden text-sm text-ink-subtle sm:block">
                        {formatDate(app.created_at)}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent stores">
          {recentTenants.length === 0 ? (
            <EmptyState>No stores provisioned yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {recentTenants.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="truncate text-sm text-ink-subtle">
                      {t.host ?? "no domain"}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col justify-center rounded-[var(--radius-lg)] border border-line bg-surface px-6 py-4">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="mt-1 text-sm text-ink-muted">{label}</span>
    </div>
  )
}
