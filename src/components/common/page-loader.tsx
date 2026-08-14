import { Skeleton } from '@/components/ui/skeleton'

export function PageLoader() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12" aria-busy aria-live="polite">
      <span className="sr-only">Loading page</span>
      <Skeleton className="h-10 w-2/3 max-w-md rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
