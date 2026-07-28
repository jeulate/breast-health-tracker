"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

interface AdminSettingsErrorProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function AdminSettingsError({ error, reset }: Readonly<AdminSettingsErrorProps>) {
  useEffect(() => {
    console.error("Error al cargar la configuración administrativa:", error);
  }, [error]);

  return (
    <section
      role="alert"
      aria-labelledby="admin-settings-error-title"
      className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30"
    >
      <p className="text-sm font-medium text-red-700 dark:text-red-300">Error de configuración</p>

      <h1
        id="admin-settings-error-title"
        className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white"
      >
        No fue posible cargar la configuración
      </h1>

      <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        Ocurrió un problema al consultar los parámetros de la aplicación. Comprueba la conexión e
        inténtalo nuevamente.
      </p>

      <div className="mt-6">
        <Button type="button" onClick={reset}>
          Volver a intentar
        </Button>
      </div>
    </section>
  );
}
