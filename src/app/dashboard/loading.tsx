function Skeleton({ className }: { className: string }) {
  return <div className={["bg-surface-secondary animate-pulse rounded-xl", className].join(" ")} />;
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando dashboard">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <Skeleton className="h-20 w-full" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Skeleton className="h-96 xl:col-span-3" />
        <Skeleton className="h-96 xl:col-span-2" />
      </div>

      <Skeleton className="h-72 w-full" />
    </div>
  );
}
