"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type {
  ClinicalEvent,
  ClinicalEventStatus,
  ClinicalEventType,
} from "@/features/clinical-timeline";
import type { ApiResponse } from "@/types";

type EventField = "type" | "eventDate" | "title" | "description" | "status";
type FieldErrors = Partial<Record<EventField, string>>;

interface ValidationIssue {
  path?: Array<string | number>;
  message?: string;
}

interface ClinicalEventFormProps {
  patientId: string;
  mode?: "create" | "edit";
  event?: ClinicalEvent;
  onCancel?: () => void;
  onSaved?: () => void;
}

const eventFields: EventField[] = ["type", "eventDate", "title", "description", "status"];

function getBoliviaToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/La_Paz",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function getFieldErrors(details: unknown): FieldErrors {
  if (!Array.isArray(details)) return {};

  const errors: FieldErrors = {};

  for (const detail of details as ValidationIssue[]) {
    const field = detail.path?.[0];

    if (
      typeof field === "string" &&
      eventFields.includes(field as EventField) &&
      typeof detail.message === "string"
    ) {
      errors[field as EventField] ??= detail.message;
    }
  }

  return errors;
}

export function ClinicalEventForm({
  patientId,
  mode = "create",
  event,
  onCancel,
  onSaved,
}: ClinicalEventFormProps) {
  const router = useRouter();
  const [type, setType] = useState<ClinicalEventType | "">(event?.type ?? "");
  const [eventDate, setEventDate] = useState(event?.eventDate ?? "");
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [status, setStatus] = useState<ClinicalEventStatus>(event?.status ?? "RECORDED");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const idPrefix = mode === "edit" ? `clinical-event-${event?.id ?? "edit"}` : "clinical-event-new";
  const scheduledControl = type === "CONTROL" && status === "SCHEDULED";

  function clearFieldError(field: EventField): void {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function resetForm(): void {
    setType("");
    setEventDate("");
    setTitle("");
    setDescription("");
    setStatus("RECORDED");
  }

  function changeType(value: ClinicalEventType): void {
    setType(value);
    setStatus(value === "CONTROL" ? "SCHEDULED" : "RECORDED");
    clearFieldError("type");
    clearFieldError("status");
  }

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>): Promise<void> {
    formEvent.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);

    try {
      if (mode === "edit" && !event) {
        setError("No se encontró el evento que deseas editar.");
        return;
      }

      const url =
        mode === "create"
          ? `/api/patients/${patientId}/timeline`
          : `/api/patients/${patientId}/timeline/${event?.id}`;
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, eventDate, title, description, status }),
      });
      const data = (await response.json()) as ApiResponse<ClinicalEvent>;

      if (!response.ok || !data.success || !data.data) {
        setFieldErrors(getFieldErrors(data.error?.details));
        setError(
          data.error?.message ??
            (mode === "create"
              ? "No fue posible registrar el evento."
              : "No fue posible actualizar el evento."),
        );
        return;
      }

      if (mode === "create") {
        resetForm();
        setSuccess("El evento clínico fue registrado correctamente.");
      }

      onSaved?.();
      router.refresh();
    } catch {
      setError("No fue posible conectar con el servidor. Intenta nuevamente.");
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

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id={`${idPrefix}-type`}
          label="Tipo de evento"
          value={type}
          onChange={(value) => changeType(value as ClinicalEventType)}
          error={fieldErrors.type}
          disabled={loading}
          placeholder="Selecciona un tipo"
          options={[
            { value: "CONTROL", label: "Control" },
            { value: "SYMPTOM", label: "Síntoma registrado" },
            { value: "NOTE", label: "Nota clínica" },
          ]}
        />

        {type === "CONTROL" ? (
          <SelectField
            id={`${idPrefix}-status`}
            label="Estado del control"
            value={status}
            onChange={(value) => {
              setStatus(value as ClinicalEventStatus);
              clearFieldError("status");
            }}
            error={fieldErrors.status}
            disabled={loading}
            placeholder="Selecciona un estado"
            options={[
              { value: "SCHEDULED", label: "Programado" },
              { value: "COMPLETED", label: "Completado" },
              { value: "CANCELLED", label: "Cancelado" },
            ]}
          />
        ) : (
          <div className="border-border bg-surface-secondary rounded-xl border px-4 py-3 text-sm">
            <p className="text-muted text-xs font-medium">Estado del registro</p>
            <p className="text-foreground mt-1 font-semibold">Registrado</p>
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id={`${idPrefix}-date`}
          label="Fecha del evento"
          type="date"
          value={eventDate}
          max={scheduledControl ? undefined : getBoliviaToday()}
          onChange={(inputEvent) => {
            setEventDate(inputEvent.target.value);
            clearFieldError("eventDate");
          }}
          error={fieldErrors.eventDate}
          helpText={
            scheduledControl
              ? "Los controles programados pueden registrar una fecha futura."
              : "Registra la fecha consignada para el evento."
          }
          required
          disabled={loading}
        />
        <Input
          id={`${idPrefix}-title`}
          label="Título"
          value={title}
          maxLength={200}
          onChange={(inputEvent) => {
            setTitle(inputEvent.target.value);
            clearFieldError("title");
          }}
          error={fieldErrors.title}
          required
          disabled={loading}
        />
      </div>

      <TextAreaField
        id={`${idPrefix}-description`}
        label="Descripción"
        value={description}
        onChange={(value) => {
          setDescription(value);
          clearFieldError("description");
        }}
        error={fieldErrors.description}
        maxLength={4000}
        disabled={loading}
      />

      <div className="border-border flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        {mode === "edit" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading
            ? mode === "create"
              ? "Registrando…"
              : "Guardando…"
            : mode === "create"
              ? "Registrar evento"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="border-border bg-surface text-foreground disabled:bg-surface-secondary min-h-10 rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  error,
  maxLength,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength: number;
  disabled?: boolean;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
        <span className="text-muted text-xs">
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        rows={4}
        className="border-border bg-surface text-foreground placeholder:text-muted disabled:bg-surface-secondary min-h-28 w-full resize-y rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
