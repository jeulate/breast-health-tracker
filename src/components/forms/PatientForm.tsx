"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ApiResponse, Patient, PatientStatus } from "@/types";

interface PatientFormProps {
  mode: "create" | "edit";
  initialValues?: {
    fullName?: string;
    birthDate?: string;
    timezone?: string;
    status?: PatientStatus;
  };
  patientId?: string;
}

interface ValidationIssue {
  path?: Array<string | number>;
  message?: string;
}

type PatientField = "fullName" | "birthDate" | "timezone" | "status";
type FieldErrors = Partial<Record<PatientField, string>>;

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

  const fieldErrors: FieldErrors = {};

  for (const detail of details as ValidationIssue[]) {
    const field = detail.path?.[0];

    if (
      typeof field === "string" &&
      ["fullName", "birthDate", "timezone", "status"].includes(field) &&
      typeof detail.message === "string"
    ) {
      fieldErrors[field as PatientField] ??= detail.message;
    }
  }

  return fieldErrors;
}

export function PatientForm({ mode, initialValues = {}, patientId }: PatientFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialValues.fullName ?? "");
  const [birthDate, setBirthDate] = useState(initialValues.birthDate ?? "");
  const [status, setStatus] = useState<PatientStatus>(initialValues.status ?? "ACTIVE");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (mode === "edit" && !patientId) {
      setError("No se encontró el identificador de la paciente.");
      return;
    }

    const normalizedFullName = fullName.trim();

    if (normalizedFullName.length < 2) {
      setFieldErrors({ fullName: "El nombre debe tener al menos 2 caracteres." });
      return;
    }

    setLoading(true);

    const url = mode === "create" ? "/api/patients" : `/api/patients/${patientId}`;
    const method = mode === "create" ? "POST" : "PUT";
    const body = {
      fullName: normalizedFullName,
      birthDate: birthDate || undefined,
      timezone: "America/La_Paz",
      ...(mode === "edit" ? { status } : {}),
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as ApiResponse<Patient>;

      if (!response.ok || !data.success || !data.data) {
        setFieldErrors(getFieldErrors(data.error?.details));
        setError(data.error?.message ?? "No fue posible guardar los datos.");
        return;
      }

      const savedPatientId = data.data.id;
      const savedAction = mode === "create" ? "created" : "updated";
      router.push(`/dashboard/patients/${savedPatientId}?saved=${savedAction}`);
      router.refresh();
    } catch {
      setError("No fue posible conectar con el servidor. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <Input
        id="fullName"
        label="Nombre completo"
        type="text"
        value={fullName}
        onChange={(event) => {
          setFullName(event.target.value);
          setFieldErrors((current) => ({ ...current, fullName: undefined }));
        }}
        error={fieldErrors.fullName}
        required
        minLength={2}
        maxLength={200}
        autoComplete="name"
        placeholder="María García"
        disabled={loading}
      />

      <Input
        id="birthDate"
        label="Fecha de nacimiento"
        type="date"
        value={birthDate}
        max={getBoliviaToday()}
        onChange={(event) => {
          setBirthDate(event.target.value);
          setFieldErrors((current) => ({ ...current, birthDate: undefined }));
        }}
        error={fieldErrors.birthDate}
        disabled={loading}
        helpText="Este campo es opcional y no admite fechas futuras."
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="timezone" className="text-foreground text-sm font-medium">
          Zona horaria
        </label>
        <select
          id="timezone"
          value="America/La_Paz"
          disabled
          aria-describedby="timezone-help"
          className="border-border bg-surface-secondary text-foreground min-h-10 cursor-not-allowed rounded-lg border px-3 py-2 text-sm opacity-80 shadow-sm"
        >
          <option value="America/La_Paz">America/La_Paz — Bolivia</option>
        </select>
        <p id="timezone-help" className="text-muted text-xs">
          Configurada automáticamente para Bolivia.
        </p>
      </div>

      {mode === "edit" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-foreground text-sm font-medium">
            Estado
          </label>
          <select
            id="status"
            value={status}
            disabled={loading}
            onChange={(event) => setStatus(event.target.value as PatientStatus)}
            className="border-border bg-surface text-foreground disabled:bg-surface-secondary min-h-10 rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="ACTIVE">Activa</option>
            <option value="INACTIVE">Inactiva</option>
          </select>
        </div>
      )}

      <div className="border-border flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Guardando…" : mode === "create" ? "Crear paciente" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
