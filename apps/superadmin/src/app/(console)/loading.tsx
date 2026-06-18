import { PageHeaderSkeleton, Panel, Skeleton } from "@/components/primitives"

// Fallback shown during any console navigation that lacks a more specific
// loading.tsx. The data fetch runs behind this so a click paints immediately.
export default function ConsoleLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="space-y-8 px-10 py-8">
        <Panel>
          <div className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}
