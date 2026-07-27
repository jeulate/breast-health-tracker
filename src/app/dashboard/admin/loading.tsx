export default function AdminLoading() {
  return (
    <section
      aria-label="Cargando administración"
      aria-busy="true"
      className="animate-pulse space-y-6"
    >
      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-80 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full max-w-2xl rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-40 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    </section>
  );
}
