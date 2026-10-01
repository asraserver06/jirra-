import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      {/* Top Navbar Skeleton */}
      <div className="h-12 border-b bg-[#0747A6] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24 bg-white/20" />
          <Skeleton className="h-6 w-16 bg-white/20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-48 rounded bg-white/20" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-60 border-r p-4 hidden md:flex flex-col gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4 mt-4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-6 w-full max-w-lg" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
