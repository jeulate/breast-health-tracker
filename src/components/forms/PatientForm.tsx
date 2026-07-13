"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type PatientStatus = "ACTIVE" | "INACTIVE";

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

interface ApiErrorResponse {
  success: false;
  error?: {
    message?: string;
  };
}

export function PatientForm({ mode, initialValues = {}, patientId }: PatientFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initialValues.fullName ?? "");
  const [birthDate, setBirthDate] = useState(initialValues.birthDate ?? "");
  const [timezone, setTimezone] = useState(initialValues.timezone ?? "America/La_Paz");
  const [status, setStatus] = useState<PatientStatus>(initialValues.status ?? "ACTIVE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (mode === "edit" && !patientId) {
      setError("No se encontró el identificador de la paciente.");
      return;
    }

    setLoading(true);

    const url = mode === "create" ? "/api/patients" : `/api/patients/${patientId}`;

    const method = mode === "create" ? "POST" : "PUT";

    const body =
      mode === "create"
        ? {
            fullName: fullName.trim(),
            birthDate: birthDate || undefined,
            timezone: timezone.trim(),
          }
        : {
            fullName: fullName.trim(),
            birthDate: birthDate || undefined,
            timezone: timezone.trim(),
            status,
          };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { success: true } | ApiErrorResponse;

      if (!response.ok || !data.success) {
        setError(
          data.success === false
            ? (data.error?.message ?? "No fue posible guardar los datos.")
            : "No fue posible guardar los datos.",
        );
        return;
      }

      router.push("/dashboard/patients");
      router.refresh();
    } catch {
      setError("No fue posible conectar con el servidor. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        onChange={(event) => setFullName(event.target.value)}
        required
        autoComplete="name"
        placeholder="María García"
        disabled={loading}
      />

      <Input
        id="birthDate"
        label="Fecha de nacimiento"
        type="date"
        value={birthDate}
        onChange={(event) => setBirthDate(event.target.value)}
        disabled={loading}
        helpText="Este campo es opcional."
      />

      <Input
        id="timezone"
        label="Zona horaria"
        type="text"
        value={timezone}
        onChange={(event) => setTimezone(event.target.value)}
        required
        disabled={loading}
        placeholder="America/La_Paz"
        helpText="Utiliza una zona horaria IANA, por ejemplo America/La_Paz."
      />

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
