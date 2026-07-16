"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ClinicalEvent, TimelineEntry } from "@/features/clinical-timeline";
import type { ApiResponse } from "@/types";
import { ClinicalEventForm } from "./ClinicalEventForm";

const typeLabels: Record<TimelineEntry["type"], string> = {
  FINDING: "Hallazgo BI-RADS",
  CONTROL: "Control",
  SYMPTOM: "Síntoma registrado",
  NOTE: "Nota clínica",
};

const statusLabels: Record<TimelineEntry["status"], string> = {
  RECORDED: "Registrado",
  SCHEDULED: "Programado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  FOLLOW_UP: "En seguimiento",
  CLOSED: "Cerrado",
};

const accentClasses: Record<TimelineEntry["type"], string> = {
  FINDING: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  CONTROL: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  SYMPTOM: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  NOTE: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

export function TimelineEntryCard({
  patientId,
  entry,
}: {
  patientId: string;
  entry: TimelineEntry;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [event, setEvent] = useState<ClinicalEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isManualEvent = entry.source === "CLINICAL_EVENT";

  async function startEditing(): Promise<void> {
    setError(null);
    setLoadingEvent(true);

    try {
      const response = await fetch(`/api/patients/${patientId}/timeline/${entry.sourceId}`);
      const data = (await response.json()) as ApiResponse<ClinicalEvent>;

      if (!response.ok || !data.success || !data.data) {
        setError(data.error?.message ?? "No fue posible cargar el evento.");
        return;
      }

      setEvent(data.data);
      setIsEditing(true);
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setLoadingEvent(false);
    }
  }

  async function deleteEvent(): Promise<void> {
    if (
      !window.confirm("¿Deseas eliminar este evento clínico? Esta acción no se puede deshacer.")
    ) {
      return;
    }

    setError(null);
    setDeleting(true);

    try {
      const response = await fetch(`/api/patients/${patientId}/timeline/${entry.sourceId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as ApiResponse<{ deleted: boolean }>;

      if (!response.ok || !data.success) {
        setError(data.error?.message ?? "No fue posible eliminar el evento.");
        return;
      }

      router.refresh();
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="border-border bg-surface relative rounded-2xl border p-5 shadow-sm">
      <span
        className="border-background absolute top-6 -left-[1.9rem] hidden h-4 w-4 rounded-full border-4 bg-rose-500 sm:block"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
              accentClasses[entry.type],
            ].join(" ")}
            aria-hidden="true"
          >
            {entry.type === "FINDING" ? "B" : entry.type.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              {typeLabels[entry.type]}
            </p>
            <h3 className="text-foreground mt-1 font-semibold break-words">{entry.title}</h3>
            <p className="text-muted mt-1 text-sm">{formatDateOnly(entry.eventDate)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="border-border bg-surface-secondary text-foreground inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
            {statusLabels[entry.status]}
          </span>
          {isManualEvent && !isEditing ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startEditing}
                disabled={loadingEvent || deleting}
              >
                {loadingEvent ? "Cargando…" : "Editar"}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={deleteEvent}
                disabled={loadingEvent || deleting}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {isEditing && event ? (
        <div className="border-border mt-5 border-t pt-5">
          <h4 className="text-foreground mb-1 font-semibold">Editar evento clínico</h4>
          <p className="text-muted mb-5 text-sm">
            Actualiza únicamente la información registrada en el expediente.
          </p>
          <ClinicalEventForm
            patientId={patientId}
            mode="edit"
            event={event}
            onCancel={() => setIsEditing(false)}
            onSaved={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <p className="text-foreground border-border mt-5 border-t pt-4 text-sm leading-6 whitespace-pre-wrap">
          {entry.description}
        </p>
      )}

      {entry.source === "FINDING" ? (
        <a
          href="#findings"
          className="mt-4 inline-flex text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
        >
          Ver en hallazgos BI-RADS
        </a>
      ) : null}
    </article>
  );
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
