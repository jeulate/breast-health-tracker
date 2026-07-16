export default function CalendarLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-7xl animate-pulse flex-col gap-6"
      aria-label="Cargando calendario"
    >
      <div className="space-y-3">
        <div className="bg-surface-secondary h-4 w-24 rounded" />
        <div className="bg-surface-secondary h-9 w-72 max-w-full rounded" />
        <div className="bg-surface-secondary h-4 w-96 max-w-full rounded" />
      </div>
      <div className="border-border bg-surface h-24 rounded-2xl border" />
      <div className="border-border bg-surface h-[32rem] rounded-2xl border" />
    </div>
  );
}
