"use client";

import { useEffect } from "react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard error", error);
  }, [error]);

  return (
    <div className="border-border bg-surface flex min-h-80 items-center justify-center rounded-2xl border p-6 text-center shadow-sm">
      <div className="max-w-md">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
          <span className="text-xl font-bold" aria-hidden="true">
            !
          </span>
        </div>
        <h2 className="text-foreground mt-4 text-xl font-bold">No se pudo cargar el dashboard</h2>
        <p className="text-muted mt-2 text-sm">
          Ocurrió un problema al consultar los indicadores. Intenta nuevamente.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:outline-none"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
