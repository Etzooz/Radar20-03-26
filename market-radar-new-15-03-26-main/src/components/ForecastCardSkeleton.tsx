import { Skeleton } from "@/components/ui/skeleton";

export function ForecastCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      {/* Price */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-7 w-[72px]" />
      </div>
      {/* Timeframes */}
      <div className="flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-7 rounded" />
        ))}
      </div>
      {/* Arc */}
      <div className="flex justify-center">
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
      </div>
      {/* Bar */}
      <Skeleton className="h-1.5 w-full rounded-full" />
      {/* Bottom */}
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}
