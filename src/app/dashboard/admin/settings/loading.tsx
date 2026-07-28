export default function AdminSettingsLoading() {
  return (
    <section
      aria-label="Cargando configuración"
      aria-busy="true"
      className="animate-pulse space-y-6"
    >
      <div className="space-y-3">
        <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-96 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full max-w-3xl rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-3">
          <div className="h-6 w-52 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-full max-w-xl rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="space-y-4">
          <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="ml-auto h-10 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
    </section>
  );
}
