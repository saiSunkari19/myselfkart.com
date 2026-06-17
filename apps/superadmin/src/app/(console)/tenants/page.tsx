import { ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"

import { DeleteDisabledButton } from "@/components/delete-disabled-button"
import { EmptyState, PageHeader, Panel } from "@/components/primitives"
import { StatusBadge } from "@/components/status-badge"
import { formatDate } from "@/lib/format"
import { platformFetch } from "@/lib/medusa"
import type { Tenant } from "@/lib/types"

export default async function TenantsPage() {
  const { tenants } = await platformFetch<{ tenants: Tenant[] }>(
    "/selfkart/platform/tenants"
  )
  const disabledCount = tenants.filter(
    (t) => t.status === "suspended" || t.status === "draft"
  ).length

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle="Every provisioned store and its domain."
        action={<DeleteDisabledButton disabledCount={disabledCount} />}
      />

      <div className="px-10 py-8">
        <Panel>
          {tenants.length === 0 ? (
            <EmptyState>No tenants yet. Approve an application to create one.</EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {tenants.map((t) => (
                <li key={t.id} className="flex items-center gap-4 px-6 py-5">
                  <Link
                    href={`/tenants/${t.id}`}
                    className="group flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate font-medium transition-colors group-hover:text-ink">
                          {t.name}
                        </p>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="mt-1 text-sm text-ink-subtle">
                        <span className="font-mono">{t.slug}</span> · created{" "}
                        {formatDate(t.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-ink-subtle transition-colors group-hover:text-ink" />
                  </Link>

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
