import { Skeleton } from "@/components/ui/skeleton";

// Layout-shaped placeholder shown while an account/admin shell resolves auth —
// the sidebar and content area shimmer in place instead of a bare spinner.
export function ShellSkeleton() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
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

          <div className="min-w-0 space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-7 w-1/3 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
