import { ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EmptyState, PageHeader, Panel } from "@/components/primitives"
import { StatusBadge } from "@/components/status-badge"
import { TenantDeletePanel } from "@/components/tenant-delete-panel"
import { TenantHostForm } from "@/components/tenant-host-form"
import { TenantLoginPanel } from "@/components/tenant-login-panel"
import { TenantStatusToggle } from "@/components/tenant-status-toggle"
import { formatDate } from "@/lib/format"
import { platformFetch, PlatformApiError } from "@/lib/medusa"
import type { TenantDetail } from "@/lib/types"

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-6 py-5">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-6 py-3 text-sm">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="min-w-0 truncate text-ink">{value}</dd>
    </div>
  )
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let detail: TenantDetail
  try {
    detail = await platformFetch<TenantDetail>(`/selfkart/platform/tenants/${id}`)
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 404) {
      notFound()
    }
    throw error
  }

  const { tenant, domains, stats, owner, admin_email } = detail

  return (
    <>
      <PageHeader
        title={tenant.name}
        subtitle={`${tenant.slug} · created ${formatDate(tenant.created_at)}`}
        action={
          tenant.host ? (
            <a
              href={`http://${tenant.host}:3000`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              Visit store <ExternalLink className="size-3.5" />
            </a>
          ) : undefined
        }
      />

      <div className="space-y-8 px-10 py-8">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" /> All tenants
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-subtle">Status</span>
          <StatusBadge status={tenant.status} />
          {tenant.plan ? (
            <span className="text-sm text-ink-muted">· {tenant.plan} plan</span>
          ) : null}
        </div>

        <Panel title="Stats">
          <div className="grid grid-cols-3 divide-x divide-[var(--color-line)]">
            <Stat label="Products" value={stats.products} />
            <Stat label="Orders" value={stats.orders} />
            <Stat label="Customers" value={stats.customers} />
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Panel title="Owner">
            {owner ? (
              <dl className="divide-y divide-[var(--color-line)]">
                <Row label="Name" value={owner.name} />
                <Row label="Email" value={owner.email} />
                <Row label="Phone" value={owner.phone ?? "—"} />
                <Row label="Applied" value={formatDate(owner.applied_at)} />
              </dl>
            ) : (
              <EmptyState>No application linked to this tenant.</EmptyState>
            )}
          </Panel>

          <Panel title="Domains">
            {domains.length === 0 ? (
              <EmptyState>No domains mapped.</EmptyState>
            ) : (
              <ul className="divide-y divide-[var(--color-line)]">
                {domains.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 px-6 py-3 text-sm"
                  >
                    <span className="truncate font-mono text-ink">{d.host}</span>
                    {d.is_primary ? (
                      <span className="shrink-0 rounded-[var(--radius-full)] border border-line px-2 py-0.5 text-xs text-ink-muted">
                        primary
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Seller login">
          <TenantLoginPanel tenantId={tenant.id} email={admin_email} />
        </Panel>

        <Panel title="Primary host">
          <TenantHostForm tenantId={tenant.id} currentHost={tenant.host} />
        </Panel>

        <Panel title="Store availability">
          <TenantStatusToggle tenantId={tenant.id} status={tenant.status} />
        </Panel>

        <Panel title="Danger zone">
          <TenantDeletePanel tenantId={tenant.id} slug={tenant.slug} />
        </Panel>
      </div>
    </>
  )
}
