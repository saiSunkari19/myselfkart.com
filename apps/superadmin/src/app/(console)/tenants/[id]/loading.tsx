import { PageHeaderSkeleton, Panel, Skeleton } from "@/components/primitives"

export default function TenantDetailLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="space-y-8 px-10 py-8">
        <Skeleton className="h-4 w-28" />

        <Panel title="Stats">
          <div className="grid grid-cols-3 divide-x divide-[var(--color-line)]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 px-6 py-5">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Panel key={i}>
              <div className="space-y-3 p-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Panel>
          ))}
        </div>

        <Panel>
          <Skeleton className="m-6 h-24" />
        </Panel>
      </div>
    </>
  )
}
