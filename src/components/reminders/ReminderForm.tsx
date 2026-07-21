"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Reminder, ReminderCandidate, ReminderChannel } from "@/features/reminders";
import {
  buildReminderPayload,
  defaultReminderTime,
  toDateTimeLocal,
} from "@/features/reminders/reminder-form";
import type { ApiResponse } from "@/types";

export function ReminderForm({
  patientId,
  timezone,
  candidates,
  telegramLinked,
  unavailableSources,
  disabled = false,
}: {
  patientId: string;
  timezone: string;
  candidates: ReminderCandidate[];
  telegramLinked: boolean;
  unavailableSources: string[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState("");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [channel, setChannel] = useState<ReminderChannel>("IN_APP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [minimumLocal] = useState(() =>
    toDateTimeLocal(new Date(Date.now() + 60_000).toISOString(), timezone),
  );
  const availableCandidates = candidates.filter(
    (candidate) =>
      !unavailableSources.includes(`${candidate.source}:${candidate.sourceId}:${channel}`),
  );
  const selected = availableCandidates.find((candidate) => candidate.id === candidateId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selected || !scheduledLocal) {
      setError("Selecciona el control y la fecha de aviso.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildReminderPayload(selected, scheduledLocal, timezone, channel);
      const response = await fetch(`/api/patients/${patientId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as ApiResponse<Reminder>;

      if (!response.ok || !data.success || !data.data) {
        setError(data.error?.message ?? "No fue posible crear el recordatorio.");
        return;
      }

      setCandidateId("");
      setScheduledLocal("");
      setSuccess("El recordatorio fue creado correctamente.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {success}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="reminder-channel" className="text-foreground text-sm font-medium">
            Canal del aviso
          </label>
          <select
            id="reminder-channel"
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value as ReminderChannel);
              setCandidateId("");
              setScheduledLocal("");
              setError(null);
            }}
            disabled={disabled || loading}
            className="border-border bg-surface text-foreground min-h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="IN_APP">Panel administrativo</option>
            {telegramLinked ? <option value="TELEGRAM">Telegram</option> : null}
          </select>
          <p className="text-muted text-xs">
            {telegramLinked
              ? "Puedes crear un aviso interno o enviarlo mediante el chat vinculado."
              : "Vincula Telegram en esta paciente para habilitar ese canal."}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reminder-source" className="text-foreground text-sm font-medium">
            Control asociado
          </label>
          <select
            id="reminder-source"
            value={candidateId}
            onChange={(event) => {
              const nextId = event.target.value;
              const candidate = candidates.find((item) => item.id === nextId);
              const suggested = candidate ? defaultReminderTime(candidate.targetDate) : "";
              setCandidateId(nextId);
              setScheduledLocal(suggested && suggested < minimumLocal ? minimumLocal : suggested);
              setError(null);
            }}
            disabled={disabled || loading || availableCandidates.length === 0}
            required
            className="border-border bg-surface text-foreground min-h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Selecciona un control</option>
            {availableCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title} · {formatDateOnly(candidate.targetDate)}
              </option>
            ))}
          </select>
          <p className="text-muted text-xs">
            Solo aparecen controles programados y seguimientos BI-RADS abiertos.
          </p>
        </div>

        <Input
          id="reminder-scheduled-for"
          label="Fecha y hora del aviso"
          type="datetime-local"
          value={scheduledLocal}
          min={minimumLocal}
          max={selected ? `${selected.targetDate}T23:59` : undefined}
          onChange={(event) => {
            setScheduledLocal(event.target.value);
            setError(null);
          }}
          helpText={`Zona horaria: ${timezone}`}
          disabled={disabled || loading || !selected}
          required
        />
      </div>

      <div className="border-border flex justify-end border-t pt-5">
        <Button
          type="submit"
          disabled={disabled || loading || !selected}
          className="w-full sm:w-auto"
        >
          {loading ? "Creando…" : "Crear recordatorio"}
        </Button>
      </div>
    </form>
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
