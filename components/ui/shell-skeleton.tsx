import { Skeleton } from "@/components/ui/skeleton";

// Layout-shaped placeholder shown while an account/admin shell resolves auth —
// the sidebar and content area shimmer in place instead of a bare spinner.
export function ShellSkeleton() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
          <div className="hidden md:block space-y-3">
            <Skeleton className="h-[72px] rounded-2xl" />
            <div className="space-y-2 pt-1">
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-7 w-56 rounded-lg" />
                <Skeleton className="h-4 w-72 max-w-full rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 md:p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-4 w-64 max-w-full rounded" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Skeleton className="aspect-3/4 rounded-xl" />
                <Skeleton className="aspect-3/4 rounded-xl" />
                <Skeleton className="aspect-3/4 rounded-xl" />
                <Skeleton className="aspect-3/4 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
