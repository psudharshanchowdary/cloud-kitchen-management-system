import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-6 space-y-4", className)}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24 bg-muted" />
        <Skeleton className="h-8 w-8 rounded-xl bg-muted" />
      </div>
      <Skeleton className="h-8 w-32 bg-muted" />
      <Skeleton className="h-3 w-48 bg-muted" />
    </div>
  );
}

export function TableSkeleton({ className, rows = 5 }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-6 space-y-4", className)}>
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <Skeleton className="h-6 w-40 bg-muted" />
        <Skeleton className="h-9 w-28 bg-muted" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2.5">
            <Skeleton className="h-4 w-[25%] bg-muted" />
            <Skeleton className="h-4 w-[20%] bg-muted" />
            <Skeleton className="h-4 w-[15%] bg-muted" />
            <Skeleton className="h-4 w-[15%] bg-muted" />
            <Skeleton className="h-6 w-20 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ className, count = 4 }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
          <Skeleton className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[40%] bg-muted" />
            <Skeleton className="h-3 w-[25%] bg-muted" />
          </div>
          <Skeleton className="h-6 w-16 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}
