"use client";

export default function ReportsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-8 text-center shadow-sm">
      <h1 className="text-foreground text-xl font-bold">No fue posible cargar los reportes</h1>
      <p className="text-muted mt-2 text-sm">
        Intenta nuevamente. Si el problema continúa, revisa la conexión con el servicio de datos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
      >
        Reintentar
      </button>
    </div>
  );
}
