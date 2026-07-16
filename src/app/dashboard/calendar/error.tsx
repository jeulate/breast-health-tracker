"use client";

import { Button } from "@/components/ui/Button";

export default function CalendarError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-80 w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10">
      <h1 className="text-foreground text-xl font-semibold">No fue posible cargar el calendario</h1>
      <p className="text-muted mt-2 text-sm leading-6">
        Comprueba la conexión e intenta nuevamente.
      </p>
      <Button type="button" onClick={reset} className="mt-5">
        Reintentar
      </Button>
    </div>
  );
}
