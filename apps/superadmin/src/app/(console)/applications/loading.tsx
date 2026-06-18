import { PageHeaderSkeleton, Panel, Skeleton } from "@/components/primitives"

export default function ApplicationsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="px-10 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-[var(--radius-full)]" />
          ))}
        </div>
        <Panel>
          <ul className="divide-y divide-[var(--color-line)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-9 w-28" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
