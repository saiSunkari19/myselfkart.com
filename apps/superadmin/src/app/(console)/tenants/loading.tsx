import { PageHeaderSkeleton, Panel, Skeleton } from "@/components/primitives"

export default function TenantsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="px-10 py-8">
        <Panel>
          <ul className="divide-y divide-[var(--color-line)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-4 w-40" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
