import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-44" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className="h-3.5 w-full" style={{ opacity: 1 - index * 0.15 }} />
        ))}
      </CardContent>
    </Card>
  );
}

export default function AppLoading() {
  return (
    <div className="animate-fade-in space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-[76px] w-full rounded-xl lg:w-[300px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Skeleton className="h-[168px] w-[168px] rounded-full" />
          </CardContent>
        </Card>
        <CardSkeleton lines={4} />
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="flex items-center gap-6 py-4">
            <Skeleton className="h-[150px] w-[150px] shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardSkeleton lines={5} />
        </div>
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
