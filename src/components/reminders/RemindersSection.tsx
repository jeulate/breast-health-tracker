"use client";

import type { Reminder, ReminderCandidate } from "@/features/reminders";
import { ReminderCard } from "./ReminderCard";
import { ReminderForm } from "./ReminderForm";

export function RemindersSection({
  patientId,
  timezone,
  patientActive,
  telegramLinked,
  reminders,
  candidates,
}: {
  patientId: string;
  timezone: string;
  patientActive: boolean;
  telegramLinked: boolean;
  reminders: Reminder[];
  candidates: ReminderCandidate[];
}) {
  const activeSources = new Set(
    reminders
      .filter((reminder) => reminder.status !== "COMPLETED" && reminder.status !== "CANCELLED")
      .map((reminder) => `${reminder.source}:${reminder.sourceId}:${reminder.channel}`),
  );
  const unavailableSources = Array.from(activeSources);
  const hasAvailableCandidate = candidates.some(
    (candidate) =>
      !activeSources.has(`${candidate.source}:${candidate.sourceId}:IN_APP`) ||
      (telegramLinked && !activeSources.has(`${candidate.source}:${candidate.sourceId}:TELEGRAM`)),
  );

  function sourceTitle(reminder: Reminder): string {
    return (
      candidates.find(
        (candidate) =>
          candidate.source === reminder.source && candidate.sourceId === reminder.sourceId,
      )?.title ??
      (reminder.source === "CLINICAL_EVENT" ? "Control registrado" : "Próximo control BI-RADS")
    );
  }

  return (
    <section id="reminders" aria-labelledby="reminders-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Fase 6</p>
          <h2 id="reminders-title" className="text-foreground mt-1 text-xl font-semibold">
            Recordatorios
          </h2>
          <p className="text-muted mt-1 text-sm">
            Avisos administrativos asociados a controles registrados.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold">
          {reminders.length} {reminders.length === 1 ? "recordatorio" : "recordatorios"}
        </span>
      </div>

       <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        Los recordatorios organizan fechas registradas y no sustituyen la indicación ni la consulta
        de un profesional de salud.
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
        <p className="text-sm font-medium">
          La hora programada representa el objetivo de envío.
        </p>
        <p className="mt-1 text-xs leading-5">
          Los recordatorios son revisados automáticamente por un procesador periódico, por lo que
          su ejecución puede producirse con un pequeño margen respecto a la hora seleccionada.
        </p>
        <p className="mt-1 text-xs leading-5">
          Cada aviso se entrega una sola vez. Si ocurre un error técnico, el sistema puede
          reintentar el procesamiento sin generar intencionalmente varios mensajes para la
          paciente.
        </p>
        <p className="mt-1 text-xs leading-5">
          Las fechas y horas se presentan usando la zona horaria{" "}
          <span className="font-semibold">{timezone}</span>.
        </p>
      </div>

      {!patientActive ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
          La paciente está inactiva. Puedes consultar el historial, pero no crear nuevos
          recordatorios.
        </div>
      ) : null}

      <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border bg-surface-secondary border-b px-5 py-4 sm:px-6">
          <h3 className="text-foreground text-base font-semibold">Crear recordatorio</h3>
          <p className="text-muted mt-1 text-sm">
            Selecciona un control existente y programa el aviso.
          </p>
        </div>
        <div className="p-5 sm:p-6">
          {!hasAvailableCandidate ? (
            <p className="text-muted text-sm leading-6">
              No existen controles programados disponibles para crear recordatorios.
            </p>
          ) : (
            <ReminderForm
              patientId={patientId}
              timezone={timezone}
              candidates={candidates}
              telegramLinked={telegramLinked}
              unavailableSources={unavailableSources}
              disabled={!patientActive}
            />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-foreground text-base font-semibold">Historial de recordatorios</h3>
        <p className="text-muted mt-1 text-sm">Ordenado por fecha de aviso.</p>
      </div>

      {reminders.length === 0 ? (
        <div className="border-border bg-surface-secondary rounded-2xl border border-dashed px-6 py-10 text-center">
          <p className="text-foreground text-sm font-semibold">No hay recordatorios registrados</p>
          <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-6">
            Los avisos creados desde un control aparecerán en esta sección.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              patientId={patientId}
              reminder={reminder}
              sourceTitle={sourceTitle(reminder)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
