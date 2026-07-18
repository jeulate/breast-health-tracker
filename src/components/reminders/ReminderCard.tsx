"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Reminder, ReminderStatus } from "@/features/reminders";
import { toDateTimeLocal, toZonedIsoDateTime } from "@/features/reminders/reminder-form";
import type { ApiResponse } from "@/types";

const statusLabels: Record<ReminderStatus, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  SENT: "Enviado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  FAILED: "Fallido",
};

const statusClasses: Record<ReminderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  SENT: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  CANCELLED: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export function ReminderCard({
  patientId,
  reminder,
  sourceTitle,
}: {
  patientId: string;
  reminder: Reminder;
  sourceTitle: string;
}) {
  const router = useRouter();
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduledLocal, setScheduledLocal] = useState(() =>
    toDateTimeLocal(reminder.scheduledFor, reminder.timezone),
  );
  const [minimumLocal] = useState(() =>
    toDateTimeLocal(new Date(Date.now() + 60_000).toISOString(), reminder.timezone),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canReschedule = reminder.status === "PENDING" || reminder.status === "FAILED";
  const canCancel = reminder.status === "PENDING" || reminder.status === "FAILED";
  const canComplete = reminder.status === "PENDING" || reminder.status === "SENT";

  async function performAction(body: Record<string, unknown>): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/reminders/${reminder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as ApiResponse<Reminder>;
      if (!response.ok || !data.success || !data.data) {
        setError(data.error?.message ?? "No fue posible actualizar el recordatorio.");
        return;
      }
      setEditingSchedule(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function reschedule(): Promise<void> {
    try {
      const scheduledFor = toZonedIsoDateTime(scheduledLocal, reminder.timezone);
      await performAction({ action: "RESCHEDULE", scheduledFor, timezone: reminder.timezone });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La fecha seleccionada no es válida.");
    }
  }

  return (
    <article className="border-border bg-surface rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">
            {reminder.source === "CLINICAL_EVENT" ? "Control clínico" : "Seguimiento BI-RADS"}
          </p>
          <h3 className="text-foreground mt-1 font-semibold break-words">{sourceTitle}</h3>
          <p className="text-muted mt-1 text-sm">Objetivo: {formatDateOnly(reminder.targetDate)}</p>
        </div>
        <span
          className={[
            "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
            statusClasses[reminder.status],
          ].join(" ")}
        >
          {statusLabels[reminder.status]}
        </span>
      </div>

      <dl className="border-border mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
        <div>
          <dt className="text-muted text-xs font-medium">Aviso programado</dt>
          <dd className="text-foreground mt-1 text-sm font-semibold">
            {formatDateTime(reminder.scheduledFor, reminder.timezone)}
          </dd>
        </div>
        <div>
          <dt className="text-muted text-xs font-medium">Canal</dt>
          <dd className="text-foreground mt-1 text-sm font-semibold">Panel interno</dd>
        </div>
        <div>
          <dt className="text-muted text-xs font-medium">Intentos</dt>
          <dd className="text-foreground mt-1 text-sm font-semibold">
            {reminder.attempts} de {reminder.maxAttempts}
          </dd>
        </div>
      </dl>

      {reminder.status === "FAILED" ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          El procesamiento requiere revisión antes de volver a intentarlo.
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      {editingSchedule ? (
        <div className="border-border mt-5 border-t pt-5">
          <Input
            id={`reminder-${reminder.id}-schedule`}
            label="Nueva fecha y hora"
            type="datetime-local"
            value={scheduledLocal}
            min={minimumLocal}
            max={`${reminder.targetDate}T23:59`}
            onChange={(event) => setScheduledLocal(event.target.value)}
            helpText={`Zona horaria: ${reminder.timezone}`}
            disabled={loading}
          />
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditingSchedule(false)}
              disabled={loading}
            >
              Volver
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={reschedule}
              disabled={loading || !scheduledLocal}
            >
              {loading ? "Guardando…" : "Guardar programación"}
            </Button>
          </div>
        </div>
      ) : canReschedule || canCancel || canComplete ? (
        <div className="border-border mt-5 flex flex-wrap justify-end gap-2 border-t pt-4">
          {canReschedule ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditingSchedule(true)}
              disabled={loading}
            >
              Reprogramar
            </Button>
          ) : null}
          {canComplete ? (
            <Button
              type="button"
              size="sm"
              onClick={() => performAction({ action: "COMPLETE" })}
              disabled={loading}
            >
              Completar
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm("¿Deseas cancelar este recordatorio?"))
                  void performAction({ action: "CANCEL" });
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
          ) : null}
        </div>
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

function formatDateTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}
