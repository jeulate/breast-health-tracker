export default function AdminUsersLoading() {
  return (
    <section aria-label="Cargando usuarios" aria-busy="true" className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-72 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full max-w-2xl rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="h-12 bg-slate-100 dark:bg-slate-800" />

        <div className="space-y-px">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-20 border-t border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      </div>
    </section>
  );
}
