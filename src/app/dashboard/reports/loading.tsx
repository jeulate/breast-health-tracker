export default function ReportsLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando reportes">
      <div className="space-y-3">
        <div className="bg-surface-secondary h-4 w-20 rounded" />
        <div className="bg-surface-secondary h-8 w-48 rounded" />
        <div className="bg-surface-secondary h-4 w-full max-w-xl rounded" />
      </div>
      <div className="border-border bg-surface h-32 rounded-2xl border" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="border-border bg-surface h-36 rounded-2xl border" />
        ))}
      </div>
      <div className="border-border bg-surface h-72 rounded-2xl border" />
    </div>
  );
}
