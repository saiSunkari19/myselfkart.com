import Link from "next/link"

import { ApplicationActions } from "@/components/application-actions"
import { EmptyState, PageHeader, Panel } from "@/components/primitives"
import { StatusBadge } from "@/components/status-badge"
import { formatDate } from "@/lib/format"
import { platformFetch } from "@/lib/medusa"
import type { SellerApplication } from "@/lib/types"

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "provisioning", label: "Provisioning" },
  { key: "active", label: "Active" },
  { key: "failed", label: "Failed" },
  { key: "rejected", label: "Rejected" },
]

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const query = status ? `?status=${encodeURIComponent(status)}` : ""
  const { applications } = await platformFetch<{ applications: SellerApplication[] }>(
    `/selfkart/platform/applications${query}`
  )

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Review seller requests and provision their store."
      />

      <div className="px-10 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = (status ?? "") === f.key
            return (
              <Link
                key={f.key || "all"}
                href={f.key ? `/applications?status=${f.key}` : "/applications"}
                className={`rounded-[var(--radius-full)] border px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-line-strong bg-surface-2 text-ink"
                    : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        <Panel>
          {applications.length === 0 ? (
            <EmptyState>No applications match this filter.</EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-wrap items-start justify-between gap-4 px-6 py-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-medium">{app.store_name}</p>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {app.owner_name} · {app.owner_email}
                    </p>
                    <p className="mt-1 text-sm text-ink-subtle">
                      {app.host ?? `${app.desired_subdomain}.…`} · {app.currency.toUpperCase()} /{" "}
                      {app.country.toUpperCase()} · applied {formatDate(app.created_at)}
                    </p>
                    {app.status === "failed" && app.provisioning_error ? (
                      <p className="mt-2 max-w-xl text-xs text-red-ink">
                        {app.provisioning_error}
                      </p>
                    ) : null}
                    {app.status === "rejected" && app.provisioning_error ? (
                      <p className="mt-2 text-xs text-ink-subtle">
                        Reason: {app.provisioning_error}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0">
                    {app.status === "pending" ? (
                      <ApplicationActions id={app.id} />
                    ) : app.status === "failed" ? (
                      <ApplicationActions id={app.id} retry />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
