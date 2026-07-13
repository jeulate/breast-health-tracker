"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PatientFormProps {
  mode: "create" | "edit";
  initialValues?: {
    fullName?: string;
    birthDate?: string;
    timezone?: string;
    status?: string;
  };
  patientId?: string;
}

export function PatientForm({ mode, initialValues = {}, patientId }: PatientFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialValues.fullName ?? "");
  const [birthDate, setBirthDate] = useState(initialValues.birthDate ?? "");
  const [timezone, setTimezone] = useState(initialValues.timezone ?? "America/Mexico_City");
  const [status, setStatus] = useState(initialValues.status ?? "ACTIVE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = mode === "create" ? "/api/patients" : `/api/patients/${patientId}`;
    const method = mode === "create" ? "POST" : "PUT";
    const body =
      mode === "create"
        ? { fullName, birthDate: birthDate || undefined, timezone }
        : { fullName, birthDate: birthDate || undefined, timezone, status };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Error al guardar");
        return;
      }
      router.push("/dashboard/patients");
      router.refresh();
    } catch {
      setError("Error de conexión. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Input
        id="fullName"
        label="Nombre completo"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        placeholder="María García"
      />
      <Input
        id="birthDate"
        label="Fecha de nacimiento (opcional)"
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
      />
      <Input
        id="timezone"
        label="Zona horaria"
        type="text"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        placeholder="America/Mexico_City"
      />
      {mode === "edit" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-gray-700">
            Estado
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-300 focus:outline-none"
          >
            <option value="ACTIVE">Activa</option>
            <option value="INACTIVE">Inactiva</option>
          </select>
        </div>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : mode === "create" ? "Crear paciente" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
