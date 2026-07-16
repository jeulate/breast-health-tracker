"use client";

import type { TimelineEntry } from "@/features/clinical-timeline";
import { ClinicalEventForm } from "./ClinicalEventForm";
import { TimelineEntryCard } from "./TimelineEntryCard";

export function ClinicalTimelineSection({
  patientId,
  entries,
}: {
  patientId: string;
  entries: TimelineEntry[];
}) {
  return (
    <section
      id="clinical-timeline"
      aria-labelledby="clinical-timeline-title"
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Fase 5</p>
          <h2 id="clinical-timeline-title" className="text-foreground mt-1 text-xl font-semibold">
            Timeline clínico
          </h2>
          <p className="text-muted mt-1 text-sm">
            Historial cronológico de hallazgos, controles y notas registradas.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold">
          {entries.length} {entries.length === 1 ? "evento" : "eventos"}
        </span>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        Registra únicamente información consignada o comunicada durante el seguimiento. La
        plataforma organiza el historial, pero no interpreta síntomas ni emite diagnósticos.
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border bg-surface-secondary border-b px-5 py-4 sm:px-6">
          <h3 className="text-foreground text-base font-semibold">Registrar evento clínico</h3>
          <p className="text-muted mt-1 text-sm">
            Añade un control, síntoma comunicado o nota de seguimiento.
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <ClinicalEventForm patientId={patientId} />
        </div>
      </div>

      <div>
        <h3 className="text-foreground text-base font-semibold">Historial cronológico</h3>
        <p className="text-muted mt-1 text-sm">Ordenado desde el evento más reciente.</p>
      </div>

      {entries.length === 0 ? (
        <div className="border-border bg-surface-secondary rounded-2xl border border-dashed px-6 py-10 text-center">
          <p className="text-foreground text-sm font-semibold">No hay eventos en el timeline</p>
          <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-6">
            Los hallazgos BI-RADS y eventos registrados aparecerán aquí en orden cronológico.
          </p>
        </div>
      ) : (
        <div className="border-border relative grid gap-4 sm:ml-6 sm:border-l sm:pl-6">
          {entries.map((entry) => (
            <TimelineEntryCard key={entry.id} patientId={patientId} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
