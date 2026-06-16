import { ExternalLink } from "lucide-react"

import { EmptyState, PageHeader, Panel } from "@/components/primitives"
import { StatusBadge } from "@/components/status-badge"
import { formatDate } from "@/lib/format"
import { platformFetch } from "@/lib/medusa"
import type { Tenant } from "@/lib/types"

export default async function TenantsPage() {
  const { tenants } = await platformFetch<{ tenants: Tenant[] }>(
    "/selfkart/platform/tenants"
  )

  return (
    <>
      <PageHeader title="Tenants" subtitle="Every provisioned store and its domain." />

      <div className="px-10 py-8">
        <Panel>
          {tenants.length === 0 ? (
            <EmptyState>No tenants yet. Approve an application to create one.</EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {tenants.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 px-6 py-5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-medium">{t.name}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink-subtle">
                      <span className="font-mono">{t.slug}</span> · created{" "}
                      {formatDate(t.created_at)}
                    </p>
                  </div>

                  {t.host ? (
                    <a
                      href={`http://${t.host}:3000`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {t.host} <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-ink-subtle">no domain</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
