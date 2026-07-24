"use client";

import { Button } from "@/components/ui/Button";

export default function ProfileError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
      <p className="text-sm font-medium text-red-600 dark:text-red-400">No se pudo abrir el perfil</p>
      <h2 className="text-foreground mt-1 text-xl font-semibold">Ocurrió un error inesperado</h2>
      <p className="text-muted mt-2 text-sm">Intenta cargar nuevamente esta sección.</p>
      <Button className="mt-5" onClick={reset}>
        Reintentar
      </Button>
    </section>
  );
}
