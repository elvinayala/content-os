import { Skeleton } from "@/components/ui/skeleton";

// El Command Center lee Google Sheets en cada request; mientras tanto,
// esqueleto con la misma silueta (hero + unidades + widgets).
export default function CeoLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
