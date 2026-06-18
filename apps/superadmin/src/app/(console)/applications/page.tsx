import { ChevronDown, Mail, MapPin, Phone, Store } from "lucide-react"
import Link from "next/link"

import { ApplicationActions } from "@/components/application-actions"
import { EmptyState, PageHeader, Panel } from "@/components/primitives"
import { StatusBadge } from "@/components/status-badge"
import { formatDate, sellingOnLabel, storefrontUrl } from "@/lib/format"
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
                <ApplicationRow key={app.id} app={app} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

/**
 * One application. The summary row carries what an operator triages on (store,
 * status, source, phone); the rest collapses into a native <details> so the list
 * stays scannable but every field is one click away. Keeping it a server
 * component (no client JS) means it streams instantly behind loading.tsx.
 */
function ApplicationRow({ app }: { app: SellerApplication }) {
  const host = app.host ?? `${app.desired_subdomain}.…`

  return (
    <li className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <details className="group min-w-0 flex-1">
          <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
            <ChevronDown className="mt-1 size-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-180" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="truncate font-medium">{app.store_name}</p>
                <StatusBadge status={app.status} />
                <SourceChip app={app} />
              </div>
              <p className="mt-1 truncate text-sm text-ink-muted">
                {app.owner_name} · {app.owner_email}
              </p>
              <p className="mt-1 text-sm text-ink-subtle">
                {host} · {app.currency.toUpperCase()} / {app.country.toUpperCase()} ·{" "}
                {app.phone ?? "no phone"} · applied {formatDate(app.created_at)}
              </p>
            </div>
          </summary>

          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 pl-7 sm:grid-cols-2">
            <DetailItem icon={MapPin} label="Sells on" value={sellingOnLabel(app.selling_on)} />
            <DetailItem icon={Phone} label="Phone" value={app.phone ?? "—"} />
            <DetailItem icon={Mail} label="Email" value={app.owner_email} />
            <DetailItem
              icon={Store}
              label="Storefront"
              value={
                app.host ? (
                  <a
                    href={storefrontUrl(app.host)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline-offset-4 hover:underline"
                  >
                    {app.host}
                  </a>
                ) : (
                  `${app.desired_subdomain} (pending)`
                )
              }
            />
            {app.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-ink-subtle">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{app.notes}</dd>
              </div>
            ) : null}
            {app.reviewed_at ? (
              <DetailItem label="Reviewed" value={formatDate(app.reviewed_at)} />
            ) : null}
          </dl>

          {app.status === "failed" && app.provisioning_error ? (
            <p className="mt-3 max-w-xl pl-7 text-xs text-red-ink">{app.provisioning_error}</p>
          ) : null}
          {app.status === "rejected" && app.provisioning_error ? (
            <p className="mt-3 pl-7 text-xs text-ink-subtle">Reason: {app.provisioning_error}</p>
          ) : null}
        </details>

        <div className="shrink-0">
          {app.status === "pending" ? (
            <ApplicationActions id={app.id} />
          ) : app.status === "failed" ? (
            <ApplicationActions id={app.id} retry />
          ) : null}
        </div>
      </div>
    </li>
  )
}

function SourceChip({ app }: { app: SellerApplication }) {
  if (!app.selling_on) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-line px-2.5 py-0.5 text-xs text-ink-muted">
      <MapPin className="size-3" aria-hidden />
      {sellingOnLabel(app.selling_on)}
    </span>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof MapPin
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-subtle">
        {Icon ? <Icon className="size-3" aria-hidden /> : null}
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm text-ink">{value}</dd>
    </div>
  )
}
